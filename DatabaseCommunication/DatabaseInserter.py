#!usr/bin/python3

import argparse
import tqdm
from DatabaseCommunication.commands import PersonCommands
from DatabaseCommunication.DatabaseOperator import DatabaseOperator

class DatabaseInserter(DatabaseOperator):
    """
    A class responsible for inserting data into database.
    """
    
    def __init__(self, config_path="DatabaseCommunication/database.ini", section="postgresql"):
        super().__init__(config_path)

    def insert_persons(self, persons):
        """
        A method for inserting person information into database.

        Parameters:
        -----------
            persons - dictionary
                A dictionary containing information about the individual speakers.
                For information on how this dictionary is made and what it contains
                see MetadataExtraction/personParser.py
        """
        with self.connection.cursor() as cursor:
            for person in tqdm.tqdm(persons, leave=False, desc="Inserting Persons"):
                p = persons[person][0]
                if len(p.sex) > 1:
                    p.sex = 'U'
                if len(p.birth) > 10:
                    p.birth= 'Unknown'
                cursor.execute(PersonCommands.INSERT_ALL,(p.personID, p.sex, p.birth,))
                for name_record in p.name_records:
                    print(name_record)
                    cursor.execute(PersonCommands.INSERT_NAME_RECORD,(name_record.since,
                                                                      name_record.to,
                                                                      name_record.surname,
                                                                      name_record.forename,
                                                                      name_record.addname,
                                                                      p.personID,))
            self.connection.commit()

