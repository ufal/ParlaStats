#!usr/bin/python3
import psycopg2
from configparser import ConfigParser


class DatabaseOperator:
    """
    A mother class for all classes which will communicate with the database.
    
    So far contains some basic functionality which all of the child classes
    might appreciate like loading the configuration and connecting to the 
    database.
    """
    def __init__(self, config_path="databaseCS.ini"):
        config = self.__load_configuration(config_path)
        self.connection = self.__establish_connection(config)

    def __load_configuration(self, config_path="databaseCS.ini", section="postgresql"):
        """
        Method for loading the database connection configuration.

        This method serves as the reader of the .ini file which describes the
        connection details like:
            1. Database server (for now localhost).
            2. Database to which we are trying to connect.
            3. Username of the user as whom we are trying to connect.
            4. Password for the username

        Parameters:
        -----------
            filename(str):
                Where should the method look for the .ini file.
            section(str):
                Relevant section of the file.

        Returns:
        --------
            Python dictionary with parameters of the connection as keys and
            their corresponding values as values.
        """
        parser = ConfigParser()
        parser.read(config_path)
        
        config = {}
        if parser.has_section(section):
            parameters = parser.items(section)
            for parameter in parameters:
                config[parameter[0]] = parameter[1]
        else:
            raise Exception(f"Section {section} not found in the file {config_path}")
        return config
    
    def __establish_connection(self, config):
        """
        A method responsible for establishing connection to the database
        server (PostgreSQL database server).

        Parameters:
        -----------
            config - dictionary
                result of the __load_configuration method.

        Returns:
        --------
            Established connection instance.
        """

        try:
            with psycopg2.connect(**config) as connection:
                connection.set_client_encoding('UTF8')
                return connection
        except (psycopg2.DatabaseError, Exception) as error:
            print(error)
        
def main():
    do = DatabaseOperator()

if __name__ == "__main__":
    main()

