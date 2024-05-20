#!usr/bin/python3

from DatabaseCommunication.DatabaseOperator import DatabaseOperator
import psycopg2
# Next line for debugging purposes:
# from DatabaseOperator import DatabaseOperator

class DatabaseQuerrier(DatabaseOperator):
    """
    A class for which handles the querying of the database.
    So far does so by reading correct PostgreSQL querries from
    standard input.
    """
    def __init__(self, config_path="database.ini"):
        super().__init__(config_path)

    def __load_query(self):
        """
        Method for loading the 
        """
        return input("Please enter the PostgreSQL format query or enter END to end the querying: \n")

    def main_loop(self):
        """
        Main querying loop.

        Loads the query from standard input and sends it directly into database.
        Then prints what database returned line by line.
        """
        try:
            with self.connection.cursor() as cursor:
                query = self.__load_query()
                while query != "END":
                    cursor.execute(query)
                    print(f"Number of entries: {cursor.rowcount}")
                    row = cursor.fetchone()

                    while row is not None:
                        print(row)
                        row = cursor.fetchone()
                    
                    query = self.__load_query()

        except (Exception, psycopg2.DatabaseError) as error:
            print(error)

if __name__ == "__main__":
    dq = DatabaseQuerrier()
    dq.main_loop()
