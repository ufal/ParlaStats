import re
import copy
from collections import OrderedDict

class SQLBuilder:
    """
    Class that facilitates transforming our custom JSON language queries to SQL.
    """
    STEPREF = re.compile(r"^step_result/(?P<step>\w+)[./](?P<col>[\w./]+)$")
    AUGMENTED_STEPREF = re.compile(r"^(?P<step>\w+)[./]\"(?P<col>[\w./]+)\"$")
    COLREF = re.compile(r"^\w+[.]\w+$")
    SPECIAL_VALUES = ['NULL']

    def __init__(self):
        # Table matching rules
        self.TABLE_MATCHING = {
            "person":[],
            "persname":["person"], 
            "organisation":[],
            "affiliation":["person", "organisation"],
            "speech":["person"],
            "speech_affiliation":["speech", "affiliation"]
        }
        # Table joining rules
        self.TABLE_JOIN_CONDITIONS = {
            ("person", "persname") : ("person_id", "person_id"),
            ("person", "affiliation") : ("person_id", "person_id"),
            ("person", "speech") : ("person_id", "person_id"),
            ("affiliation", "organisation") : ("organisation_id", "organisation_id"),
            ("speech", "speech_affiliation") : ("id", "speech_id"),
            ("speech_affiliation", "affiliation") : ("affiliation_id", "aff_id")
        }
        self.SPEECH_TIME_COLUMNS = ["time_start", "time_end", "earliest_timestamp", "latest_timestamp"]
        self.join_end = 0;
    
    def _detect_dependencies(self, step: dict, exposed_cols: dict) -> list[tuple]:
        """
        Method for finding dependencies on other step CTEs.
        """
        deps = []
        def register(prev: str, ref: str):
            remote = self._resolve_exposed(prev, ref, exposed_cols, need="exposed")

            local = self._pick_correct_local_column(step, prev, ref, remote, exposed_cols)
            deps.append((prev, local, remote))

        def scan_token(token: str):
            m = self.AUGMENTED_STEPREF.match(token)
            if m and m.group('step') not in self.TABLE_MATCHING:
                register(m.group("step"), m.group("col"))
        for col in step["columns"]:
            if isinstance(col,str):
                
                scan_token(col)
            else:
                scan_token(col.get('real', ""))

                if isinstance(col.get('alias'), str):
                    scan_token(col['alias'])

        for cond in step['filtering']['conditions']:
            scan_token(cond['value'])
        return deps


    def _pick_correct_local_column(self, step: dict, prev_step: str, ref_col: str, remote_alias: str, exposed: dict) -> str:
        """
        Find a real column referenced by alias from other place.
        """
        for col in step['columns']:
            if not isinstance(col, dict):
                continue
            if isinstance(col, dict) and col.get('alias') == remote_alias:
                real = col['real']
                if not real.startswith(f'{prev_step}.'):
                    return real
        
        remote_real = exposed[prev_step].get(remote_alias)['real']
        if remote_real:
            return remote_real

        return ref_col

    def _inject_dep_joins(self, core_sql, deps):
        """
        Insert joins with other step CTES when needed.
        """
        if not deps:
            return core_sql
       

        where_pos = core_sql.lower().find(" where ")
        search_scope = core_sql[: where_pos if where_pos != -1 else len(core_sql)]
        from_match = re.search(r"\bFROM\b", core_sql, re.I)
        insert_at = from_match.end()
        
        from_pos = re.search(r"\bWHERE\b", core_sql, re.I)
        from_pos = from_pos.end() - 5 if from_pos else self.join_end
        join_snippets = []
        for prev, local, remote in deps:
            col_name = local.split('.')[-1]
            if local.startswith(f"{prev}."):
                alias = None
                for m in re.finditer(rf"\b(\w+)\.{re.escape(col_name)}\b", search_scope):
                    if m.group(1) != prev:
                        alias = m.group(1)
                        break
                if not alias:
                    alias = re.search(r"\bFROM\s+(\w+)", core_sql, re.I).group(1)
                local = f"{alias}.{col_name}"
            join_snippets.append(f" JOIN {prev} ON {local} = {prev}.{remote} \n")
        return core_sql[:from_pos] + "".join(join_snippets) + " " + core_sql[from_pos:]

    def build_step_cte(self, step: dict, exposed_cols: dict) -> tuple[str, list, dict]:
        """
        Main method for building step CTEs.
        """
        step = copy.deepcopy(step)
        

        for cond in step["filtering"]["conditions"]:
            new_val = self.inline_step_ref(cond["value"], exposed_cols)
            if new_val: cond["value"] = new_val
        #================= AUGMENT COLUMNS =========================
        new_cols = []

        for col in step["columns"]:
            if isinstance(col, str) and (m := self.STEPREF.fullmatch(col)):
                exposed_name = self._resolve_exposed(m.group('step'), m.group('col'), exposed_cols, need="exposed")
                new_cols.append({
                    "real":f"{m.group('step')}.{exposed_name}",
                    "alias":exposed_name,
                    "alias_step":m.group('step'),
                    "agg_func":""
                })

            elif isinstance(col, str) and '.' in col:
                alias_sql = f'"{col.replace("\"","\"\"")}"'
                new_cols.append({
                    "real":col,
                    "alias":alias_sql,
                    "agg_func":""
                })
                               
            else:
                new_cols.append(col)
                
        step["columns"] = new_cols
        #===========================================================
        # CECK IF ONLY USING ITEMS FROM OTHER STEPS
        only_proj_refs = all(
            isinstance(c, dict) 
            and c.get("alias_step")
            and c["real"].startswith(f"{c['alias_step']}.")
            for c in step["columns"]
        ) and not step["filtering"]["conditions"]

        if only_proj_refs:
            prev = step["columns"][0]["alias_step"]
            select_list = ", ".join(
                f"{prev}.{c['alias']} AS {c['alias']}" for c in step["columns"]
            )
            sql = f"SELECT {select_list} FROM {prev}"
            params = []
            exposed = {c["alias"]: {"exposed": c["alias"], "real": c["alias"] }
                        for c in step["columns"]}
            return sql, params, exposed
        #================ AUGMENT GROUP BY =========================
        if "aggregation" in step and step["aggregation"].get("group_by"):
            new_group_by = []
            
            for gb in step["aggregation"]["group_by"]:
                if isinstance(gb, str) and (m := self.STEPREF.fullmatch(gb)):
                    alias = self._resolve_exposed(m.group('step'), m.group('col'), exposed_cols, need="exposed")
                    new_group_by.append(alias)

                elif isinstance(gb, dict):
                    real = gb.get("real","")
                    if isinstance(real, str) and (m := self.STEPREF.fullmatch(real)):
                        alias = self._resolve_exposed(m.group('step'), m.group('col'), exposed_cols, need="exposed")
                        new_group_by.append(alias)
                    else:
                        new_group_by.append(gb)
                else:
                    new_group_by.append(gb)
            step["aggregation"]["group_by"] = new_group_by
        #===========================================================
        #=============== AUGMENT ORDER BY ==========================
        if "aggregation" in step and step["aggregation"].get("order_by"):
            new_order_by = []

            for ob in step["aggregation"]["order_by"]:
                if isinstance(ob, str) and (m := self.STEPREF.fullmatch(ob)):
                    alias = self._resolve_exposed(m.group('step'), m.group('col'), exposed_cols, need="exposed")
                    new_order_by.append(alias)
                elif isinstance(ob, dict):
                    real = ob.get("real", "")
                    if isinstance(real, str) and (m := self.STEPREF.fullmatch(real)):
                        alias = self._resolve_exposed(m.group('step'), m.group('col'), exposed_cols, need="exposed")
                        new_order_by.append(alias)
                    else:
                        new_order_by.append(ob)
                else:
                    new_order_by.append(ob)
            step["aggregation"]["order_by"] = new_order_by
        #===========================================================
        core_sql, params = self.buildSQLQuery(step, exposed_cols)

        sql = self._inject_dep_joins(core_sql, self._detect_dependencies(step, exposed_cols))

        exposed = {}
        for col in step['columns']:
            if isinstance(col, str):
                real = col
                alias = col.split('.')[-1]
            else:
                real = col['real']
                alias = col.get('alias') or real.split('.')[-1]

            exposed_key = alias
            exposed[exposed_key] = {
                "exposed":alias,
                "real":real
            }
            exposed[real] = exposed[exposed_key]
            exposed[real.split('.')[-1]] = exposed[exposed_key]

        return sql, params, exposed

    def inline_step_ref(self, val: str, exposed_cols: dict) -> str | None:
        """
        Direct replacement of step references with SQL snippet.
        Used for example in value section of conditions
        """
        m = self.STEPREF.match(val)
        if not m:
            return None
        step, ref_col = m.group('step'), m.group('col')
        if step not in exposed_cols:
            raise ValueError(f"Unknown step '{step}' in {val}.")
        real_name = self._resolve_exposed(step, ref_col, exposed_cols)
        
        if real_name.startswith('"') and real_name.endswith('"'):
            pass

        elif ('.' in real_name):
            real_name = real_name.split('.')[-1]
        
        return f"(SELECT {real_name} FROM {step})"

    def _resolve_exposed(self, step: str, ref_col: str, exposed_cols: dict, need="exposed") -> str:
        """
        Get requested column exposed by different step
        """
        entry = exposed_cols.get(step, {}).get(ref_col)
        
        if not entry:
            key = ref_col.split('.')[-1]
            entry = exposed_cols.get(step, {}).get(key)

        if not entry:
            self._fail_unknown(step, ref_col, exposed_cols)
        
        return entry[need]

    @staticmethod
    def _fail_unknown(step: str, ref: str, mapping: dict):
        raise ValueError(
            f"Step '{step}' does not expose a column called '{ref}'. "
            f"Available: {', '.join(mapping.get(step,{}).keys())}"
        )

    def buildSQLQuery(self, json_query: dict, exposed_cols: dict | None = None) -> tuple[str, list]:
        """
        Method for building raw SQL of the step CTE
        """
        exposed_cols = exposed_cols or {}
        self.join_end = 0
        select_part = self.parse_columns(json_query['columns'])
        joins_part = self.parse_joins(
            self.determine_joins(
                json_query['columns'],
                json_query['filtering']['conditions'],
                json_query['aggregation']['group_by'],
            )
        )
        self.join_end = len(f"    SELECT {select_part}{joins_part}")
        where_part, params = self.parse_conditions(json_query['filtering']['conditions'], exposed_cols)
        group_part = self.parse_group_by(json_query['aggregation']['group_by'], json_query['columns'])
        order_part = self.parse_order_by(json_query['aggregation']['order_by'])
        limit_part = self.parse_limit(json_query.get('limit'))

        sql = f"    SELECT {select_part}{joins_part}{where_part}{group_part}{order_part}{limit_part}"
        return sql, params
        
    def parse_limit(self, limit):
        return f" LIMIT {limit}" if limit else ""

    def parse_order_by(self, order_by):
        """
        Transform order by section of the JSON query.
        """
        if not order_by:
            return ""
        parts = []
        for ob in order_by:
            col = ob['column']
            direction = ob['direction']
            nulls = " NULLS LAST " if direction == 'DESC' else " NULLS FIRST "
            if isinstance(col, str):
                parts.append(f"{col} {direction} {nulls}\n")
            else:
                func = col['agg_func']
                real = col['real']
                if func == 'COUNT':
                    parts.append(f"COUNT(DISTINCT {real}) {direction} {nulls} \n")
                else:
                    parts.append(f"{func}({real}) {direction} {nulls} \n")
        return " ORDER BY " + ", ".join(parts)

    def parse_group_by(self, group_by, columns):
        """
        Transform group by section of the JSON query.
        """
        items = []
        need_artificial = any(
            isinstance(c, dict) and c.get("agg_func") not in ("", None, "DISTINCT")
            for c in columns
        )

        if need_artificial:
            for c in columns:
                if isinstance(c, dict):
                    if c.get("agg_func") in ("", None, "DISTINCT"):
                        items.append(c.get('alias') or c["real"])
                else:
                    items.append(c)

        if group_by:
            for gb in group_by:
                if isinstance(gb, str):
                    items.append(gb + ' \n')
                else:
                    items.append(gb['real'] + ' \n')

        uniq = list(OrderedDict.fromkeys(items))
        return f"     GROUP BY {', '.join(uniq)}" if uniq else ""

    def parse_conditions(self, conditions, exposed_cols):
        """
        Transform the conditions section of the JSON query.
        """
        if not conditions:
            return "", []
        fragments, params = [], []
        for cond in conditions:
            col, op, val = cond['column'], cond['operator'], cond['value']
            
            if isinstance(val, str) and val.lstrip().upper().startswith("(SELECT"):
                val_sql = val
            else:
                
                        
                inlined = self.inline_step_ref(val, exposed_cols)
                if inlined:
                    val_sql = inlined
                elif self.COLREF.match(val) and not val.startswith("'"):
                    val_sql = val
                else:
                    val_sql = "%s"
                    literal = val.strip("'") if isinstance(val, str) else val
                    if (',' in literal):
                        val_sql = literal;
                    elif (literal in self.SPECIAL_VALUES):
                        val_sql = literal;
                    else:
                        params.append(literal)

            fragments.append(f"{col} {op} {val_sql} \n")
            
        return "      WHERE " + "          AND ".join(fragments), params

    def determine_joins(self, columns, conditions, group_by):
        """
        Look at the relevant sections of the JSON query and figure out which 
        joins need to be performed in the SQL.
        """
        required = []
        explicit = set()

        def add (table, *, is_explicit = False):
            if table not in required:
                required.append(table)
            if is_explicit:
                explicit.add(table)
        
        for table in self.TABLE_MATCHING:
            for col in columns:
                if (isinstance(col, str) and table in col) or (isinstance(col, dict) and table in col['real']):
                    add(table, is_explicit=True)
            
            for gb in (group_by or []):
                if table in gb:
                    add(table, is_explicit=True)

            for cond in conditions:
                if table in cond['column'] or table in cond['value']:
                    add(table, is_explicit=True)

        if ("organisation" in required and 
            "speech" in required and
            "person" not in explicit and
            "speech_affiliation" not in required):

            required.insert(required.index("speech") + 1, "speech_affiliation")
        
        processing_order = ["speech", "speech_affiliation", "affiliation", "organisation", "persname"]

        joins: list[tuple[str, str]] = []

        def push(pair):
            if pair not in joins:       
                joins.append(pair)

        for table in processing_order:
            if table not in required:
                continue

            if table == "speech":
                push(("person", "speech"))

            elif table == "speech_affiliation":
                push(("speech", "speech_affiliation"))

            elif table == "affiliation":
                wants_link = (
                    "speech_affiliation" in required and
                    "person" not in explicit
                )
                if wants_link:
                    push(("speech_affiliation", "affiliation"))
                else:
                    push(("person", "affiliation"))

            elif table == "organisation":
                wants_link = (
                    "speech_affiliation" in required and
                    "person" not in explicit
                )
                if wants_link:
                    push(("speech_affiliation", "affiliation"))
                else:
                    push(("person", "affiliation"))
                push(("affiliation", "organisation"))

            elif table == "persname":
                push(("person", "persname"))

        return joins


    def parse_joins(self, joins):
        """
        Make the SQL joins.
        """
        res = " FROM person \n  "
        for left, right in joins:
            lcol, rcol = self.TABLE_JOIN_CONDITIONS[(left, right)]
            res += f"    LEFT JOIN {right} ON {left}.{lcol} = {right}.{rcol} \n"
        return res

    def parse_columns(self, columns):
        """
        Transform the columns section of the JSON query.
        """
        out = []
        for col in columns:
            if isinstance(col, str):
                if "step_result" not in col:
                    out.append(col)
                if len(col.split('.')) > 2: 
                    out.append(f"{col.split('.')[0]}.{col.split('.')[2]}")
            else:
                real = col["real"]
                alias = col.get("alias", "")
                func = col.get("agg_func", "")
                expr = real
                if func == "COUNT":
                    expr = f"COUNT(DISTINCT {real})"
                elif func:
                    expr = f"{func}({real})"
                if alias:
                    expr += f" AS {alias}"
                    
                out.append(expr)
        return ", ".join(out)

