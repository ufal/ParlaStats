#!usr/bin/python3

from flask import Flask, request, jsonify
import psycopg2
from configparser import ConfigParser
from argparse import ArgumentParser

app = Flask(__name__)

args_parser = ArgumentParser()

args_parser.add_argument("--db", type=str, default="../DatabaseCommunication/databaseCS.ini", help="connection parameters")
    
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

def determine_joins(columns):
    """
    Determine the necessary joins to perform to satisfy the filtering part of
    the json queries.
    """
    required = set()
    cols = ", ".join(columns)
    tables = TABLE_MATCHING.keys()
    for table in tables:
        if table in cols:
            required.add(table)
    
    joins = []
    if "person" in required:
        required.remove("person")
    for table in required:
        if table in TABLE_MATCHING and "person" in TABLE_MATCHING[table]:
            joins.append(("person", table))
        elif table == "organisation":
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

def SQLBuilder(json_query):
    # SELECT CLAUSE
    columns = ', '.join(json_query['filtering']['columns'])
    sql_query = f"SELECT {columns} FROM person "

    # FROM AND JOIN CLAUSES
    joins = determine_joins(json_query['filtering']['columns'])
    for left_table, right_table in joins:
        left_column, right_column = TABLE_JOIN_CONDITIONS[(left_table, right_table)]
        sql_query += f"LEFT JOIN {right_table} ON {left_table}.{left_column} = {right_table}.{right_column} "
    
    # CONDITIONS
    conditions = json_query["filtering"]["conditions"]
    if conditions:
        where_clause = "WHERE " + " AND ".join([f"{cond['column']} {cond['operator']} {cond['value']}" for cond in conditions])
        sql_query += where_clause
    
    # GROUP BY
    group_by = json_query["aggregation"]["group_by"]
    if group_by:
        group_clause = " GROUP BY " + ", ".join(group_by)
        sql_query += group_clause
    
    # ORDER BY
    order_by = json_query["aggregation"]["order_by"]
    if order_by:
        order_clause = " ORDER BY " + ", ".join([f"{ob['column']} {ob['direction']}" for ob in order_by])
        sql_query += order_clause
    
    # LIMIT
    limit = json_query["filtering"]["limit"]
    if limit:
        limit_clause = f" LIMIT {limit}"
        sql_query += limit_clause
    
    return sql_query, [cond['value'] for cond in conditions]
    
    
@app.route('/query', methods=['POST'])
def query():
    json_query = request.json
    target_databases = json_query["target_databases"]
    res = []
    for database in target_databases:
        sql_query, params = SQLBuilder(json_query)
        connection = connect_to_database(f"../DatabaseCommunication/{database}.ini")
        cursor = connection.cursor()
        cursor.execute(sql_query, params)
        results = cursor.fetchall()
        cursor.close()
        connection.close()

        columns = [col.split(' AS ')[-1] for col in json_query["filtering"]["columns"]]
        response = [dict(zip(columns, row)) for row in results]
        # kluc result dalsie veci
       
        res.append(response)
    
    return jsonify(res)
if __name__ == "__main__":
    app.run(debug=True)
