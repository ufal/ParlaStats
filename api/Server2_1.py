#!usr/bin/python3

from flask import Flask, request, jsonify, abort
from flask.json.provider import JSONProvider
import psycopg2
from configparser import ConfigParser
from argparse import ArgumentParser
import decimal
from json import JSONEncoder
import json
from datetime import datetime, time, date
import sys
from metainformationFetcher import metainformationFetcher
# from SQLBuilder import SQLBuilder
from SQLBuilder2 import SQLBuilder
from collections import OrderedDict

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


# args_parser = ArgumentParser()

# args_parser.add_argument("--db", type=str, default="../DatabaseCommunication/", help="connection parameters")
    
# args = args_parser.parse_args()

class EmptyClass(object):
    pass
args = EmptyClass()
setattr(args,"db","../DatabaseCommunication/")

sql_builder = SQLBuilder()

def connect_to_database(db_ini_path=args.db):
    parser = ConfigParser()
    parser.read(db_ini_path)
    config = {}
    if parser.has_section("postgresql"):
        parameters = parser.items("postgresql")
        for parameter in parameters:
            config[parameter[0]] = parameter[1]
    else:
        raise Exception(f"Malformed database.ini file, please see README.md")
    try:
        with psycopg2.connect(**config) as connection:
            connection.set_client_encoding('UTF8')
            return connection
    except (psycopg2.DatabaseError, Exception) as error:
        print(error)


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
        connection = connect_to_database(f"{args.db}{database}.ini")
        cursor = connection.cursor()

        cte_snippets, all_params = [], []
        exposed_cols = {}
        for step in json_query["steps"]:
            snippet, params, outcols = sql_builder.build_step_cte(step, exposed_cols)
            cte_snippets.append(f"{step['goal']} AS (\n  {snippet}\n)")
            all_params.extend(params)
            exposed_cols[step["goal"]] = outcols
        
        final_step = json_query["steps"][-1]["goal"]
        full_sql = "WITH\n" + ",\n".join(cte_snippets) + f"\nSELECT * FROM {final_step};"
        print("SQL:\n", full_sql)
        print("params:", all_params)
        with open('sql.txt', 'w') as f:
            f.write(full_sql)
        cursor.execute(full_sql, all_params)
        columns = [d.name for d in cursor.description]
        rows = cursor.fetchall()

        res.append({"database": database,
                     "data": format_output([dict(zip(columns,r)) for r in rows])})
    # for database in target_databases:
    #     step_results = {}
    #     connection = connect_to_database(f"{args.db}{database}.ini")
    #     cursor = connection.cursor()
    #     try:
    #         for step in json_query['steps']:
    #             sql_query, params = sql_builder.buildSQLQuery(step, step_results)
    #             ctes.append()
    #             print(f'SQL: {sql_query}')
    #             print(f'Parameters: {params}')
    #             cursor.execute(sql_query, params)
    #             step_results[step['goal']] = cursor.fetchall()
    #     except ValueError as e:
    #         return jsonify({"error": str(e)}), 400
    #     cursor.close()
    #     connection.close()
    #     final_step_name = json_query['steps'][-1]['goal']
    #     results = step_results[final_step_name]
    #     columns = []
    #     for column in json_query['steps'][-1]['columns']:
    #         if (isinstance(column, str)): columns.append(column)
    #         elif (isinstance(column, dict)): columns.append(column["alias"])
    #     # columns = [col.split(' AS ')[-1] for col in json_query['steps'][-1]['columns']]
    #     response = []
    #     for column in columns:
    #         if 'step_result' in column:
    #             parts = column.split('/')
    #             results.extend(step_results[parts[1]])

        
    #     response = [dict(zip(columns, row)) for row in results]
    #     res.append({"database": database, "data":format_output(response)})
    return jsonify(res)

"""
=================================================================================================================
############################# DATABASE META INFORMATION FETCHING ################################################
=================================================================================================================
"""
@app.route('/metainformation')
def get_metainformation_JSON():
    return jsonify(metainformationFetcher.make_metainformation_JSON())

"""
=================================================================================================================
############################ METADATA ENDPOINTS #################################################################
=================================================================================================================
"""
@app.route('/meta_text')
def provide_textual_suggestions():
    field = request.args.get("field", "").strip()
    q = request.args.get("q", "").strip()
    limit = request.args.get("limit", 10, type=int)
    target_databases = request.args.get("dbs", None).split(',')
    if not ('.' in field):
        abort(400, f"Unknown field: {field}")
    if not q:
        return jsonify([])

    field = field.split('.')
    table = field[0]
    column = field[1]
    pattern = f"%{q}%%"

    rows = []
    SQL_query = (
        f"SELECT DISTINCT {column} AS value "
        f"FROM {table} "
        f"WHERE {column} ILIKE %(pattern)s "
        f"ORDER BY {column} "
        f"LIMIT %(limit)s "
    )
    for database in target_databases:
        with connect_to_database(f'../DatabaseCommunication/{database}.ini') as db_connection:
            with db_connection.cursor() as cursor:
                cursor.execute(SQL_query, {"pattern": pattern, "limit": limit})
                rows.extend(r[0] for r in cursor.fetchall())

    uniq = list(OrderedDict.fromkeys(rows))
    return jsonify([{"value": v} for v in uniq])

@app.route('/meta_numeric')
def provide_numeric_sggestions():
    field = request.args.get("field", "").strip()
    target_databases = request.args.get("dbs", None).split(',')
    if not ('.' in field):
        abort(400, f"Unknown field: {field}")
    
    field = field.split('.')
    table = field[0]
    column = field[1]
    
    SQL_query = (
        f"SELECT MAX({column}) AS maximum, MIN({column}) AS minimum "
        f"FROM {table} "
    )
    
    rows = []
    for database in target_databases:
        with connect_to_database(f'../DatabaseCommunication/{database}.ini') as db_connection:
            with db_connection.cursor() as cursor:
                cursor.execute(SQL_query)
                rows.extend((database,r) for r in cursor.fetchall())
    
    print(rows)
    res = [{res[0]: {"max":res[1][0], "min":res[1][1]} for res in rows}]


    print(res)
    return jsonify(res)
if __name__ == "__main__":
    app.run(debug=True)
