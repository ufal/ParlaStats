#!usr/bin/python3

from flask import Flask, request, jsonify
import psycopg2
from configparser import ConfigParser
app = Flask(__name__)

def connect_to_database(db_ini_path="../DatabaseCommunication/database.ini"):
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
            return connection
    except (psycopg2.DatabaseError, Exception) as error:
        print(error)

def SQLBuilder(json_query):
    # SELECT CLAUSE
    columns = ', '.join(json_query['filtering']['columns'])
    sql_query = f"SELECT {columns} FROM "

    # FROM AND JOIN CLAUSES
    tables = json_query['aggregation']['tables']
    print(tables)
    joins = json_query['aggregation']['joins']
    from_clause = tables[0]
    for join in joins:
        from_clause += f" {join['type']} JOIN {join['right_table']} ON {join['left_table']}.{join['left_column']} = {join['right_table']}.{join['right_column']} "
    sql_query += from_clause

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
    sql_query, params = SQLBuilder(json_query)
    print(sql_query)
    connection = connect_to_database()
    cursor = connection.cursor()
    cursor.execute(sql_query, params)
    results = cursor.fetchall()
    cursor.close()
    connection.close()

    columns = [col.split(' AS ')[-1] for col in json_query["filtering"]["columns"]]
    response = [dict(zip(columns, row)) for row in results]

    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
