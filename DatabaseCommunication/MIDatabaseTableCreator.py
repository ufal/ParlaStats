#!usr/bin/python3

import psycopg2
from DatabaseCommunication.DatabaseOperator import DatabaseOperator

class MIDatabaseTableCreator(DatabaseOperator):
    """
    A class for creating tables in the common ParlaStats database.

    Responsible for creating the common postgres database tables.
    """
    def __init__(self, config_path="parlastats_common.ini", log=False):
        super().__init__(config_path)
        print("Table creator connected successfully.")
        self.log = log

    def create_tables(self):
        commands = [
                """
                CREATE TABLE IF NOT EXISTS databases (
                    id SERIAL PRIMARY KEY,
                    database_name TEXT UNIQUE NOT NULL
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS tables (
                    id SERIAL PRIMARY KEY,
                    database_id INT REFERENCES databases(id),
                    schema_name TEXT NOT NULL,
                    table_name TEXT NOT NULL
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS columns (
                    id SERIAL PRIMARY KEY,
                    table_id INT REFERENCES tables(id),
                    column_name TEXT NOT NULL,
                    data_type TEXT NOT NULL
                )

                """,
                """
                CREATE TABLE IF NOT EXISTS artificial_columns (
                    month INTEGER,
                    day_of_the_week TEXT,
                    year INTEGER,
                    PRIMARY KEY (month, day_of_the_week, year)
                );
                """
                ]
        try:
            with (self.connection.cursor() as cursor):
                for command in commands:
                    cursor.execute(command)

            self.connection.commit()
        except(psycopg2.DatabaseError, Exception) as error:
            print(error)
