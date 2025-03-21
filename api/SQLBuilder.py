#!usr/bin/python3

import argparse

args_parser = argparse.ArgumentParser();
args_parser.add_argument("--json_query", type=str, default=None, help="JSON query to buil SQL from")


class SQLBuilder:
    def __init__(self):
        self.TABLE_MATCHING = {
            "person":[],
            "persname":["person"],
            "organisation":[],
            "affiliation":["person", "organisation"],
            "speech":["person"]
        }
        self.TABLE_JOIN_CONDITIONS = {
            ("person", "persname") : ("person_id", "person_id"),
            ("person", "affiliation") : ("person_id", "person_id"),
            ("person", "speech") : ("person_id", "person_id"),
            ("affiliation", "organisation") : ("organisation_id", "organisation_id")
        }
        self.SPEECH_TIME_COLUMNS = ["time_start", "time_end", "earliest_timestamp", "latest_timestamp"]
    
    def determine_joins(self, columns, conditions, group_by):
        required = set()
        tables = self.TABLE_MATCHING.keys()
        print(columns)
        for table in tables:
            for col in columns:
                if (isinstance(col, str)):
                    if table in col and table not in required:
                        required.add(table)
                elif (isinstance(col, dict)):
                    if table in col["real"] and table not in required:
                        required.add(table)
            
            for gb in group_by:
                if table in gb and table not in required:
                    required.add(table)
        
        for cond in conditions:
            for table in tables:
                if (table in cond["column"]) and (table not in required):
                    required.add(table)
       
        joins = []
        if "person" in required:
           required.remove("person")
        
        for table in required:
            if table in self.TABLE_MATCHING and "person" in self.TABLE_MATCHING[table]:
                joins.append(("person", table))
            elif table == "organisation":
                if ("person", "affiliation") not in joins:
                    joins.append(("person", "affiliation"))
                joins.append(("affiliation", table))
            else:
                raise ValueError(f"Unsupported table join: person -> {table}")
        return joins
    
    def buildSQLQuery(self, json_query, step_results):
        sql_query = "SELECT "
        sql_query += self.parse_columns(json_query["columns"])
        joins = self.determine_joins(json_query["columns"],
                                json_query["filtering"]["conditions"],
                                json_query["aggregation"]["group_by"])
        
        sql_query += self.parse_joins(joins)
        sql_query += self.parse_conditions(json_query["filtering"]["conditions"], 
                                           step_results)
        
        sql_query += self.parse_group_by(json_query["aggregation"]["group_by"])
        sql_query += self.parse_order_by(json_query["aggregation"]["order_by"])
        sql_query += self.parse_limit(json_query["limit"])

        parameters = [cond['value'] for cond in json_query["filtering"]["conditions"] if not cond['value'].startswith("step_result.")]
        return sql_query, parameters
    
    def parse_limit(self, limit):
        res = ""
        if limit:
            limit_clause = f" LIMIT {limit}"
            res += limit_clause
        return res

    def parse_order_by(self, order_by):
        res = ""
        if order_by:
            order_clause = " ORDER BY "
            for ob in order_by:
                if (isinstance(ob['column'], str)):
                    order_clause += f"{ob['column']} {ob['direction']}"
                elif (isinstance(ob['column'], dict)):
                    order_clause += f"{ob['column']['agg_func']}({ob['column']['real']})"
                    order_clause += f" {ob['direction']} "
            res += order_clause
        return res

    def parse_group_by(self, group_by):
        res = ""
        if group_by:
            group_clause = " GROUP BY "
            for gb in group_by:
                if (isinstance(gb, str)):
                    group_clause += f'{gb}, '
                elif (isinstance(gb, dict)):
                    group_by_clause += f"{gb['agg_func']}(gb['real']), "
            res += group_clause
        return res

    def parse_conditions(self, conditions, step_results):
        res = ""
        if conditions:
            modify = lambda x : "'"+x[0]+"'"
            where_clause = " WHERE " + " AND ".join(
                [
                    f"{cond['column']} {cond['operator']} {cond['value']}" if not cond['value'].startswith("step_result.") else
                    f"{cond['column']} {cond['operator']} ({','.join(map(modify, step_results[cond['value'].split('.')[1]]))})" if len(step_results[cond['value'].split('.')[1]]) > 1 else
                    f"{cond['column']} {cond['operator']} '{step_results[cond['value'].split('.')[1]][0][0]}'"
                    for cond in conditions
                ]
            )
            res += where_clause
        return res

    def parse_joins(self, joins):
        res = " FROM person "
        for left_table, right_table in joins:
            left_column, right_column = self.TABLE_JOIN_CONDITIONS[(left_table, right_table)]
            res += f"LEFT JOIN {right_table} ON {left_table}.{left_column} = {right_table}.{right_column} "
        return res
        
    def parse_columns(self, columns):
        res = ""
        for column in columns:
            if (isinstance(column, str)):
                res += column + ', '
            if (isinstance(column, dict)):
                real_part = column["real"]
                res_temp = real_part
                alias = column["alias"]
                aggregation_function = column["agg_func"]
                if (aggregation_function != ""): res_temp = f"{aggregation_function}({real_part})"
                if (alias != ""): res_temp += f" AS {alias}"
                res += res_temp + ', '
        return res[:-2]


def main(args):
    ...   


if __name__ == "__main__":
    main(args_parser.parse_args())
