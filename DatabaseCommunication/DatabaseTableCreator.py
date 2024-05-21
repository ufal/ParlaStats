#!usr/bin/python3

import psycopg2
from DatabaseCommunication.DatabaseOperator import DatabaseOperator

class DatabaseTableCreator(DatabaseOperator):
    """
    A database table creator class.

    Responsible for creating and maybe eventualy deleting database tables.

    Inherits from DatabaseOperator, for more information see DatabaseOperator.
    """
    def __init__(self, config_path="database.ini", log=False):
        super().__init__(config_path)
        print("Database table creator connected succesfully.")
        self.log = log
    def create_tables(self):
        """
        Method for creating tables in the database.

        Current commands are something like tables so far, I know they may
        be wrong or but for now I want to see if they at least somehow create
        the tables.

        Open for discussion and adaptation.
        """
        commands = [
                """
                CREATE TABLE IF NOT EXISTS Person (
                    person_id VARCHAR(100) PRIMARY KEY,
                    sex VARCHAR(1),
                    birth VARCHAR(20)
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS persName (
                    id SERIAL PRIMARY KEY,
                    since DATE,
                    until DATE,
                    surname VARCHAR(100),
                    forename VARCHAR(100),
                    addname VARCHAR(100),
                    person_id VARCHAR(100),
                    FOREIGN KEY (person_id)
                        REFERENCES Person (person_id)
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS speech (
                    id SERIAL PRIMARY KEY,
                    date DATE,
                    token_count INTEGER, 
                    sentence_count INTEGER,
                    named_entity_count INTEGER,
                    author_id VARCHAR(100), 
                    FOREIGN KEY (author_id)
                        REFERENCES Person (person_id)
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS organisation (
                    organisation_id VARCHAR(100) PRIMARY KEY,
                    role VARCHAR(100),
                    name VARCHAR(400)
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS affiliation (
                    aff_id SERIAL PRIMARY KEY,
                    since DATE,
                    until DATE,
                    role VARCHAR(100),
                    person_id VARCHAR(100),
                    organisation_id VARCHAR(100), 
                    FOREIGN KEY (person_id)
                        REFERENCES Person (person_id),
                    FOREIGN KEY (organisation_id)
                        REFERENCES organisation (organisation_id)
                )
                """
                ]
        try:
            with self.connection.cursor() as cursor:
                for command in commands:
                    cursor.execute(command)
                    if self.log:
                        print(f"{command} done.")

            self.connection.commit()
        except (psycopg2.DatabaseError, Exception) as error:
            print(error)

def main():
    dtc = DatabaseTableCreator()
    dtc.create_tables()

if __name__ == "__main__":
    main()
