#!usr/bin/python3

from flask import Flask, request, jsonify
from flask.json.provider import JSONProvider
import psycopg2
from configparser import ConfigParser
from argparse import ArgumentParser
import decimal
from json import JSONEncoder
import json
from datetime import datetime, time, date
import sys

class CustomJSONifier(JSONEncoder):
    """
    A simple class overriding the default method of JSONEncoder, so it can 
    encode types like TIME
    """
    def default(self, obj):
        if isinstance(obj, (datetime, time, date)):
            return obj.isoformat()
        return super().default(obj)

class CustomJSONProvider(JSONProvider):
    """
    Simple JSON provider modifications, that allow for usage of custom jsonifier.
    """
    def dumps(self, obj, **kwargs):
        return json.dumps(obj, **kwargs, cls=CustomJSONifier)
    def loads(self, s : str | bytes, **kwargs):
        return json.loads(s, **kwargs)
    

app = Flask(__name__)
app.json = CustomJSONProvider(app)


args_parser = ArgumentParser()

args_parser.add_argument("--db", type=str, default="../DatabaseCommunication/", help="connection parameters")
    
args = args_parser.parse_args()

TABLE_MATCHING = {
    "person":[],
    "persName":["person"],
    "organisation":[],
    "affiliation":["person", "organisation"],
    "speech":["person"]
}

TABLE_JOIN_CONDITIONS = {
    ("person", "persName") : ("person_id", "person_id"),
    ("person", "affiliation") : ("person_id", "person_id"),
    ("person", "speech") : ("person_id", "person_id"),
    ("affiliation", "organisation") : ("organisation_id", "organisation_id")
}

SPEECH_TIME_COLUMNS = ["time_start", "time_end", "earliest_timestamp", "latest_timestamp"]

def determine_joins(columns, conditions, group_by):
    """
    Determine the necessary joins to perform to satisfy the filtering part of
    the json queries.
    """
    required = set()
    tables = TABLE_MATCHING.keys()
    for table in tables:
        for col in columns:
            if table in col and table not in required:
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
        if table in TABLE_MATCHING and "person" in TABLE_MATCHING[table]:
            joins.append(("person", table))
        elif table == "organisation":
            if ("person", "affiliation") not in joins:
                joins.append(("person", "affiliation"))
            joins.append(("affiliation", table))
        else:
            raise ValueError(f"Unsuported table join: person -> {table}")
    
    return joins



def connect_to_database(db_ini_path=args.db):
    parser = ConfigParser()
    print(db_ini_path)
    parser.read(db_ini_path)
    config = {}
    if parser.has_section("postgresql"):
        print("here")
        parameters = parser.items("postgresql")
        for parameter in parameters:
            config[parameter[0]] = parameter[1]
    else:
        raise Exception(f"Malformed database.ini file, please see README.md")
    try:
        with psycopg2.connect(**config) as connection:
            return connection
    except (psycopg2.DatabaseError, Exception) as error:
        print(error)

def SQLBuilder(json_query, step_results):
    columns = ", ".join(json_query["columns"])
    sql_query = f"SELECT {columns} FROM person "
    
    # Get necessary joins
    joins = determine_joins(json_query["columns"],
                            json_query["filtering"]["conditions"],
                            json_query["aggregation"]["group_by"])

    # Build FROM and JOIN clauses
    for left_table, right_table in joins:
        left_column, right_column = TABLE_JOIN_CONDITIONS[(left_table, right_table)]
        sql_query += f"LEFT JOIN {right_table} ON {left_table}.{left_column} = {right_table}.{right_column} "
    
    # Build WHERE clause
    conditions = json_query["filtering"]["conditions"]
    if conditions:
        modify = lambda x : "'"+x[0]+"'"
        where_clause = "WHERE " + " AND ".join(
                [
                    f"{cond['column']} {cond['operator']} {cond['value']}" if not cond['value'].startswith("step_result.") else
                    f"{cond['column']} {cond['operator']} ({','.join(map(modify, step_results[cond['value'].split('.')[1]]))})" if len(step_results[cond['value'].split('.')[1]]) > 1 else
                    f"{cond['column']} {cond['operator']} '{step_results[cond['value'].split('.')[1]][0][0]}'"
                    for cond in conditions
                ]
        )
        sql_query += where_clause
    
    # Build GROUP BY clause
    group_by = json_query["aggregation"]["group_by"]
    if group_by:
        group_clause = " GROUP BY " + ", ".join(group_by)
        sql_query += group_clause

    # Build ORDER BY clause
    order_by = json_query["aggregation"]["order_by"]
    if order_by:
        order_clause = " ORDER BY " + ", ".join([f"{ob['column']} {ob['direction']}" for ob in order_by])
        sql_query += order_clause

    # LIMIT
    limit = json_query["limit"]
    if limit:
        limit_clause = f" LIMIT {limit}"
        sql_query += limit_clause
        
    parameters = [cond['value'] for cond in conditions if not cond['value'].startswith("step_result.")]
    return sql_query, parameters

def format_output(results):
    """
    A function for formatting the extreme vales in the output.
    """
    formatted_results = []
    for result in results:
        formatted_result = {}
        for key, value in result.items():
            if isinstance(value, decimal.Decimal):
                value = float(value)
                if value < 0e-5:
                    value = 0.0
            if isinstance(value, decimal.Decimal):
                value = round(float(value), 3)
            if value != None:
                formatted_result[key] = value
        if len(formatted_result) > 0:    
            formatted_results.append(formatted_result)
    
    return formatted_results

@app.route('/query', methods=['POST'])
def query():
    json_query = request.json
    target_databases = json_query["target_databases"]
    res = []
    for database in target_databases:
        if (database) == "databaseCS":
            step_results = {}
            connection = connect_to_database(f"{args.db}{database}.ini")
            cursor = connection.cursor()
            try:
                for step in json_query['steps']:
                    sql_query, params = SQLBuilder(step, step_results)
                    cursor.execute(sql_query, params)
                    step_results[step['goal']] = cursor.fetchall()
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            cursor.close()
            connection.close()
            final_step_name = json_query['steps'][-1]['goal']
            results = step_results[final_step_name]
            columns = [col.split(' AS ')[-1] for col in json_query['steps'][-1]['columns']]
            response = [dict(zip(columns, row)) for row in results]
       
            res.append(format_output(response))
    return jsonify(res)
if __name__ == "__main__":
    app.run(debug=True)
