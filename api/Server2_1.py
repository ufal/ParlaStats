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
from metainformationFetcher import metainformationFetcher
from SQLBuilder import SQLBuilder

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
        step_results = {}
        connection = connect_to_database(f"{args.db}{database}.ini")
        cursor = connection.cursor()
        try:
            for step in json_query['steps']:
                sql_query, params = sql_builder.buildSQLQuery(step, step_results)
                cursor.execute(sql_query, params)
                step_results[step['goal']] = cursor.fetchall()
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        cursor.close()
        connection.close()
        final_step_name = json_query['steps'][-1]['goal']
        results = step_results[final_step_name]
        columns = []
        for column in json_query['steps'][-1]['columns']:
            if (isinstance(column, str)): columns.append(column)
            elif (isinstance(column, dict)): columns.append(column["alias"])
        # columns = [col.split(' AS ')[-1] for col in json_query['steps'][-1]['columns']]
        response = [dict(zip(columns, row)) for row in results]
        res.append(database)
        res.append(format_output(response))
    return jsonify(res)

"""
=================================================================================================================
############################# DATABASE META INFORMATION FETCHING ################################################
=================================================================================================================
"""
@app.route('/metainformation')
def get_metainformation_JSON():
    return jsonify(metainformationFetcher.make_metainformation_JSON())

if __name__ == "__main__":
    app.run(debug=True)
