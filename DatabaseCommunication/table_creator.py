#!usr/bin/python3
import psycopg2
from config import load_configuration
from connect import connect

def create_tables():
    """
    Function for creating tables in the database.

    Commands are something like templates so far, I know they may be wrong
    or incorrect but for now I want to see if they at least somehow create the tables.

    Open for discussion and adaptation.
    """
    commands = [
            """
            CREATE TABLE IF NOT EXISTS persName (
                name_id SERIAL PRIMARY KEY,
                since VARCHAR(10),
                until VARCHAR(10),
                surname VARCHAR(100),
                forename VARCHAR(100),
                addname VARCHAR(100)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS speech (
                speech_id VARCHAR(100) PRIMARY KEY,
                date VARCHAR(10),
                token_count INTEGER,
                sentence_count INTEGER,
                named_entity_count INTEGER
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS Person (
                person_id VARCHAR(100) PRIMARY KEY,
                sex VARCHAR(1), 
                birth VARCHAR(10),
                name_record_id INTEGER,
                given_speech_id VARCHAR(100),
                FOREIGN KEY (name_record_id)
                    REFERENCES persName (name_id),
                FOREIGN KEY (given_speech_id)
                    REFERENCES speech (speech_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS organisation (
                organisation_id VARCHAR(100) PRIMARY KEY, 
                role VARCHAR(100),
                name VARCHAR(100)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS affiliation (
                aff_id SERIAL PRIMARY KEY,    
                since VARCHAR(10),
                until VARCHAR(10),
                role VARCHAR(100),
                person_id VARCHAR(100),
                organisation_id VARCHAR(100),
                FOREIGN KEY (person_id)
                    REFERENCES Person (person_id),
                FOREIGN KEY (organisation_id)
                    REFERENCES organisation (organisation_id)
            )
            """,
            ]
    try:
        config = load_configuration()
        with psycopg2.connect(**config) as connection:
            with connection.cursor() as cursor:
                for command in commands[:2]:
                    cursor.execute(command)
                    print(command)
                    print("done")
        with psycopg2.connect(**config) as connection:
            with connection.cursor() as cursor:
                for command in commands[2:]:
                    cursor.execute(command)
                    print(command)
                    print("done")
    except (psycopg2.DatabaseError, Exception) as error:
        print(error)

if __name__ == "__main__":
    create_tables()
