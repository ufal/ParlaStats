#!usr/bin/python3

from flask import Flask, jsonify, request, send_file
from configparser import ConfigParser
import psycopg2
import argparse
import matplotlib.pyplot as plt
import io

args_parser = argparse.ArgumentParser()

args_parser.add_argument("--connection_config", type=str, default="../DatabaseCommunication/database.ini",
                         help="Path to the database connection file database.ini")
args = args_parser.parse_args()

app = Flask(__name__)

def connect_to_database():
    parser=ConfigParser()
    parser.read(args.connection_config)
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

@app.route('/api/total_length/female', methods=['GET'])
def get_total_length_of_speeches_by_females():
    connection = connect_to_database()
    cursor = connection.cursor()
    cursor.execute("SELECT SUM(token_count) FROM (speech INNER JOIN person ON speech.author_id = person.person_id) WHERE sex = 'F';")
    result = cursor.fetchone()
    cursor.close()
    connection.close()
    return jsonify({"Total length of speeches given by female politicians":
                    result})


@app.route('/api/comparisons/male_vs_female', methods=['GET'])
def get_comparison_male_vs_female():
    connection = connect_to_database()
    cursor = connection.cursor()
    cursor.execute("SELECT p.sex, AVG(s.token_count) as avg_duration FROM speech s JOIN person p ON s.author_id = p.person_id GROUP BY p.sex")
    results = cursor.fetchall()
    cursor.close()
    connection.close()
    print(results)
    genders = [row[0] for row in results]
    avg_durations = [row[1] for row in results]
    
    plt.figure(figsize=(8,6))
    plt.bar(genders, avg_durations, color=['pink', 'blue', 'green'])
    plt.xlabel('Gender')
    plt.ylabel('Average speech tokens')
    plt.title('Average speech token count by Gender')
    plt.grid(True)
    
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()

    return send_file(img, mimetype='image/png')




if __name__ == '__main__':
    app.run()
