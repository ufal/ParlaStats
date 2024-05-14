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
            CREATE TABLE IF NOT EXISTS Person (
                id SERIAL PRIMARY KEY,
                person_id VARCHAR(100),
                sex VARCHAR(1), 
                birth VARCHAR(10)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS persName (
                id SERIAL PRIMARY KEY,
                since VARCHAR(10),
                until VARCHAR(10),
                surname VARCHAR(100),
                forename VARCHAR(100),
                addname VARCHAR(100),
                person_id SERIAL,
                FOREIGN KEY (person_id)
                    REFERENCES Person (id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS speech (
                id SERIAL PRIMARY KEY,
                speech_id VARCHAR(100),
                date VARCHAR(10),
                token_count INTEGER,
                sentence_count INTEGER,
                named_entity_count INTEGER,
                author_id SERIAL,
                FOREIGN KEY (author_id)
                    REFERENCES Person (id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS organisation (
                id SERIAL PRIMARY KEY,
                organisation_id VARCHAR(100), 
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
                person_id SERIAL,
                organisation_id SERIAL,
                FOREIGN KEY (person_id)
                    REFERENCES Person (id),
                FOREIGN KEY (organisation_id)
                    REFERENCES organisation (id)
            )
            """,
            ]
    try:
        config = load_configuration()
        with psycopg2.connect(**config) as connection:
            with connection.cursor() as cursor:
                for command in commands:
                    cursor.execute(command)
                    print(command)
                    print("done")
    except (psycopg2.DatabaseError, Exception) as error:
        print(error)

if __name__ == "__main__":
    create_tables()
