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

@app.route('/api/custom_query', methods=['POST'])
def custom_query():
    data = request.get_json()
    query_type = data.get('query_type')
    parameters = data.get('parameters', {})
    
    connection = connect_to_database()
    cursor = connection.cursor()
    ############################################################################################
    # SECTION 1 - gender statistics                                                            #
    ############################################################################################

    # NON-COMPARISON
    ############################################################################################
    if query_type == 'genders':
        what = parameters.get('what')
        target_data = parameters.get('target_data')
        gender = parameters.get('gender')
        cursor.execute("""SELECT {}(s.{}) FROM speech s JOIN person p ON s.author_id = p.person_id
                       WHERE p.sex='{}';""".format(what, target_data, gender))
        result = cursor.fetchone()
        cursor.close()
        connection.close()
        return jsonify({f'{what} of {target_data} for gender {gender}': result})

    # COMPARISON
    ############################################################################################
    if query_type == 'comp_genders':
        what_to_compare = parameters.get('what')
        column = parameters.get('column')
        cursor.execute("""SELECT p.sex, {}(s.{}) FROM speech s JOIN person p
                       ON s.author_id = p.person_id GROUP BY p.sex;""".format(what_to_compare, column))

        result = cursor.fetchall()
        cursor.close()
        connection.close()
        genders = [row[0] for row in result]
        data = [row[1] for row in result]
        plt.figure(figsize=(8,6))
        plt.bar(genders, data, color=['pink', 'blue', 'grey'])
        plt.xlabel("Gender")
        plt.ylabel(f"{what_to_compare} of {column}")
        plt.title(f"{what_to_compare} of {column} by genders")

        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        plt.close()

        return send_file(img, mimetype='image/png')

    # TIME FRAME NON-COMPARISON
    ############################################################################################
    if query_type == 'genders_tf':
        what = parameters.get('what')
        target_data = parameters.get('target_data')
        gender = parameters.get('gender')
        since = parameters.get('since')
        to = parameters.get('to')
        cursor.execute("""SELECT {}(s.{}) FROM speech s JOIN person p
                       ON s.author_id = p.person_id
                       WHERE p.sex = '{}' AND s.date > '{}' AND s.date < '{}';""".format(what, target_data, gender, since, to))
        result = cursor.fetchone()
        cursor.close()
        connection.close()
        return jsonify({'result': result})

    # TIME FRAME COMPARISON
    ############################################################################################
    if query_type == 'comp_genders_tf':
        what = parameters.get('what')
        target_data = parameters.get('target_data')
        since = parameters.get('since')
        to = parameters.get('to')
        cursor.execute("""SELECT p.sex, {}(s.{}) FROM speech s JOIN person p
                       ON s.author_id = p.person_id 
                       WHERE s.date > '{}' AND s.date < '{}'
                       GROUP BY p.sex;""".format(what, target_data, since, to))

        result= cursor.fetchall()
        cursor.close()
        connection.close()
        print(result)
        genders = [row[0] for row in result]
        values = [row[1] for row in result]
        plt.figure(figsize=(8,6))
        plt.bar(genders, values, color=["pink", "blue", "grey"])
        plt.xlabel('Gender')
        plt.ylabel(f"{what} of {target_data}")
        plt.title(f"{what} of {target_data} in time frame {since} - {to}")
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        plt.close()
        
        return send_file(img, mimetype='image/png')


    ############################################################################################
    # SECTION 2 - individual politicians statistics                                            #
    ############################################################################################
    
    # NON-COMPARISON SPECIFIC SPEKER
    ############################################################################################
    elif query_type == 'specific_speaker':
        what = parameters.get('what')
        target_data = parameters.get('target_data')
        name = parameters.get('name')
        name = name.split()
        cursor.execute("""SELECT {}(s.{}) FROM speech s  
                       JOIN persName n ON s.author_id = n.person_id 
                       WHERE n.forename = '{}' AND n.surname = '{}';""".format(what, target_data, name[0], name[1]))

        result = cursor.fetchone()
        cursor.close()
        connection.close()

        return jsonify({'result':result})
    
    # NON-COMPARISON SPECIFIC SPEAKER TIME FRAME
    ############################################################################################
    elif query_type == 'specific_speaker_tf':
        what = parameters.get('what')
        target_data = parameters.get('target_data')
        name = parameters.get('name')
        since = parameters.get('since')
        to = parameters.get('to')
        name = name.split()
        cursor.execute("""SELECT {}(s.{}) FROM speech s 
                       JOIN persName n ON s.author_id = n.person_id
                       WHERE n.forename = '{}' AND n.surname = '{}'
                       AND s.date > '{}' AND s.date < '{}';""".format(what, target_data, name[0],
                                                                       name[1], since, to))
        result = cursor.fetchone()
        cursor.close()
        connection.close()
        return jsonify({'result':result})

    # COMPARISON SPECIFIC SPEAKERS
    ############################################################################################
    elif query_type == 'comp_specific_speakers':
        what = parameters.get('what')
        target_data = parameters.get('target_data')
        names = parameters.get('names')
        names = names.split(',')
        person_ids = []
        
        for name in names:
            name = name.split()
            cursor.execute("""SELECT person_id FROM persName WHERE forename='{}' AND surname='{}'""".format(name[0], name[1]))
            person_ids.append(cursor.fetchone()[0])
        
        cursor.execute("""SELECT {}(s.{}) FROM speech s JOIN persName p on s.author_id = p.person_id  
                       WHERE s.author_id IN {} GROUP BY s.author_id""".format(what, target_data,tuple(person_ids)))
        
        result = cursor.fetchall()
        cursor.close()
        connection.close()
        values = [row[0] for row in result]
        
        plt.figure(figsize=(10,6))
        plt.bar(names, values)
        plt.xlabel("Speakers")
        plt.ylabel(f"{what} of {target_data}")
        plt.title(f"Comprison of {what} of {target_data} for specific politicians")
        plt.xticks(rotation=45)
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        return send_file(img, mimetype='image/png')
            
    # COMPARISON SPECIFIC SPEAKERS TIME FRAME
    ############################################################################################
    elif query_type == 'comp_specific_speakers_tf':
        what = parameters.get('what')
        target_data = parameters.get('target_data')
        names = parameters.get('names')
        names = names.split(',')
        since = parameters.get('since')
        to = parameters.get('to')
        person_ids = []
        for name in names:
            name = name.split()
            cursor.execute("""SELECT person_id FROM persName WHERE forename='{}' AND surname='{}'""".format(name[0], name[1]))
            person_ids.append(cursor.fetchone()[0])

        cursor.execute("""SELECT {}(s.{}) FROM speech s JOIN persName p ON s.author_id = p.person_id
                       WHERE s.author_id IN {} AND s.date > '{}' and s.date < '{}' GROUP BY s.author_id""".format(what, target_data, tuple(person_ids), since, to))

        result = cursor.fetchall()
        cursor.close()
        connection.close()
        values = [row[0] for row in result]

        plt.figure(figsize=(10,6))
        plt.bar(names, values)
        plt.xlabel("Speakers")
        plt.ylabel(f"{what} of {target_data}")
        plt.title(f"Comparison of {what} of {target_data} for specific politicoans from {since} to {to}")
        plt.xticks(rotation=45)
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        return send_file(img, mimetype="image/png")

    # RANKING SPEAKERS
    #############################################################################################
    elif query_type == 'rank_speakers':
        criterion_q = None
        names = []
        gender = None
        criterion = parameters.get("criterion")
        if criterion.lower() == 'total speeches':
            criterion_q = "COUNT(*)"
        elif criterion.lower() == 'total length':
            criterion_q = "SUM(s.token_count)"
        number = parameters.get('number')
        ordering = parameters.get('ordering')
        if 'gender' in parameters.keys():
            gender = parameters.get('gender')
        if gender:
            cursor.execute("""SELECT s.author_id, {} AS criterion FROM speech s JOIN person p ON s.author_id = p.person_id
                           WHERE p.sex = '{}'
                           GROUP BY s.author_id
                           ORDER BY criterion {} LIMIT {}""".format(criterion_q, gender, ordering, number))
        else:
            cursor.execute("""SELECT s.author_id, {} AS criterion FROM speech s JOIN person p ON s.author_id = p.person_id
                           GROUP BY s.author_id
                           ORDER BY criterion {} LIMIT {}""".format(criterion_q, ordering, number))
        
        result = cursor.fetchall()
        person_ids = [row[0] for row in result]
        for person_id in person_ids:
            cursor.execute("""SELECT forename, surname FROM persName
                           WHERE person_id ='{}'""".format(person_id))
            names.append(" ".join(cursor.fetchone()))
        values = [row[1] for row in result]
        cursor.close()
        connection.close()
        plt.figure(figsize=(20,20))
        plt.bar(names, values)
        plt.xlabel("Speakers")
        plt.ylabel(f"Criterion")
        plt.title(f"Ranking of speakers based on {criterion}")
        plt.xticks(rotation=45, ha='right',fontsize=10)
        img = io.BytesIO()
        plt.savefig(img, format='png')
        img.seek(0)
        return send_file(img, mimetype="image/png")
        

    cursor.close()
    connection.close()
    return jsonify({'error':'Unknown query type'}), 400

if __name__ == '__main__':
    app.run(debug=True)
