#!usr/bin/python3

from configparser import ConfigParser

def load_configuration(filename='database.ini', section='postgresql'):
    """
    Load function for database connection configuration

    This function serves as reader of the .ini file which describes the
    connection details like:
        1. database server for now localhost
        2. Database to wich we are trying to connect
        3. Username of the user as whom we are trying to connect
        4. Corresponding password

    Parameters:
    -----------
        filename (str):
            Where should the function look for the .ini file.
        section (str):
            Relevant section of the file.
    Returns:
    --------
        Python dictionary with parameters of the connection as keys and their
        values as values.
    """

    parser = ConfigParser()
    parser.read(filename)

    config = {}
    if parser.has_section(section):
        parameters = parser.items(section)
        for parameter in parameters:
            config[parameter[0]] = parameter[1]
    else:
        raise Exception(f"Section {section} not found in file {filename}")

    return config

if __name__ == "__main__":
    load_configuration()
    print("Loading configuration succesful")
