#!usr/bin/python3

import pprint
import psycopg2
import argparse
from configparser import ConfigParser

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--database_ini_path", default="../DatabaseCommunication/meta.ini", 
                         type=str, help="Path to database connection configuration file.")

class metainformationFetcher:
    @staticmethod
    def connect_to_database(database_ini_path="../DatabaseCommunication/meta.ini"):
        parser = ConfigParser()
        parser.read(database_ini_path)
        config = {}
        if parser.has_section('postgresql'):
            parameters = parser.items('postgresql')
            for parameter in parameters:
                config[parameter[0]] = parameter[1]
        
        
        try:
            with psycopg2.connect(**config) as connection:
                connection.set_client_encoding('UTF-8')
                return connection
        except (psycopg2.DatabaseError, Exception) as error:
            
            print(error)
    
    @staticmethod
    def make_metainformation_JSON(database_ini_path="../DatabaseCommunication/meta.ini"):
        with metainformationFetcher.connect_to_database(database_ini_path) as meta_connection:
            with meta_connection.cursor() as meta_cursor:
                meta_cursor.execute("SELECT database_name FROM databases;")
                available_databases = [row[0] for row in meta_cursor.fetchall()]

                meta_cursor.execute("""
                                SELECT DISTINCT t.table_name, c.column_name, c.data_type
                                FROM columns c
                                JOIN tables t ON c.table_id = t.id;
                               """)
                table_columns = [{ "column":f"{row[0]}.{row[1]}", "type":row[2]} for row in meta_cursor.fetchall()]
                json_response = {
                    "available_databases": available_databases,
                    "columns": table_columns,
                    "aggregation": {
                        "group_by": table_columns,
                        "order_by": table_columns
                    },
                    "filtering": {
                        "column": table_columns
                    }
                }

                return json_response



def main(args):
    pprint.pprint(metainformationFetcher.make_metainformation_JSON())

if __name__ == "__main__":
    main(args_parser.parse_args())

