#!usr/bin/python3

import pprint
import psycopg2
import argparse
from configparser import ConfigParser
import datetime

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--database_ini_path", default="../DatabaseCommunication/meta.ini", 
                         type=str, help="Path to database connection configuration file.")

class metainformationFetcher:
    """
    A class that facilitates communication with the metadata database.
    This is used in web interface to provide users with some information about data available
    in the backend.
    """
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
        """
        Method for forwarding the metainformation about stored data to a json response
        The json response encodes the columns available in corpora databases along with 
        their datatype and sample values (with exception for textual columns, these are handled differently)
        """
        with metainformationFetcher.connect_to_database(database_ini_path) as meta_connection:
            with meta_connection.cursor() as meta_cursor:
                meta_cursor.execute("SELECT database_name FROM databases;")
                available_databases = [row[0] for row in meta_cursor.fetchall() if row[0] != 'postgres']
                
                meta_cursor.execute("""
                                SELECT DISTINCT t.table_name, c.column_name, c.data_type
                                FROM columns c
                                JOIN tables t ON c.table_id = t.id
                                ORDER BY t.table_name;
                               """)

                table_columns = [{ "column":f"{row[0]}.{row[1]}", "type":row[2], "data":{} } for row in meta_cursor.fetchall()]
                print(table_columns)
                for database in available_databases:
                    with metainformationFetcher.connect_to_database(f'../DatabaseCommunication/{database}.ini') as db_connection:
                        with db_connection.cursor() as db_cursor:
                            for entry in table_columns:
                                column_split = entry["column"].split('.');
                                if (column_split[0] == "speech_affiliation"): continue
                                if (entry["type"] in ["character varying", "text"]):
                                    entry["data"][database] = []
                                else:
                                    db_cursor.execute(f"SELECT MIN({column_split[1]}) AS minimum, MAX ({column_split[1]}) AS maximum FROM {column_split[0]}")
                                    fetched_data = [(row[0], row[1]) for row in db_cursor.fetchall()]
                                    if (entry["type"] in ["date", "time without timezone"]):
                                        if (fetched_data[0][0] and fetched_data[0][1]):
                                            minimum = fetched_data[0][0].isoformat()
                                            maximum = fetched_data[0][1].isoformat()
                                            entry["data"][database] = [minimum, maximum]
                                        else:
                                            entry["data"][database] = [ "None","None" ]
                                    else:
                                        entry["data"][database] = [ fetched_data[0][0], fetched_data[0][1] ]
                
                               
                json_response = {
                    "available_databases": available_databases,
                    "columns": table_columns,
                    
                }
                return json_response



def main(args):
    pprint.pprint(metainformationFetcher.make_metainformation_JSON())
if __name__ == "__main__":
    main(args_parser.parse_args())

