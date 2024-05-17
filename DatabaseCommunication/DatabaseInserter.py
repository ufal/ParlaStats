#!usr/bin/python3

import argparse
import tqdm
from DatabaseCommunication.commands import PersonCommands
from DatabaseCommunication.commands import OrganisationCommands
from DatabaseCommunication.commands import SpeechCommands
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
                self.__insert_name_records(p.name_records,p.personID, cursor)
            self.connection.commit()
    
    def __insert_name_records(self, name_records, personID, cursor):
        """
        A method for inserting name records of a person
        """
        for name_record in name_records:
            cursor.execute(PersonCommands.INSERT_NAME_RECORD,(name_record.since,
                                                              name_record.to,
                                                              name_record.surname,
                                                              name_record.forename,
                                                              name_record.addname,
                                                              personID,))
    
    def insert_affiliation_records(self,affiliations, personID):
        """
        A method for inserting person-party affiliation information into database.

        Parameters:
        -----------
            affiliations - dictionary
                A dictionary containing infromation about the person-party affiliations.
                For information on how this dictionary is made and what it contains 
                see MetadataExtraction/personParser.py
        """
        with self.connection.cursor() as cursor:
            for affiliation_record in affiliations:
                cursor.execute(PersonCommands.INSERT_AFFILIATION_RECORD, (affiliation_record.since,
                                                                          affiliation_record.to,
                                                                          affiliation_record.role,
                                                                          personID,
                                                                          affiliation_record.party[1:]))
            
            self.connection.commit()
    
    def insert_organisations(self, organisations):
        """
        A method for inserting organisations into database.

        Parameters:
        -----------
            organisations - dictionary
                A dictionary containing information about the political organisations.
                For information on how this dictionary is made and what it contains
                see MetadataExtraction/orgParser.py
        """
        with self.connection.cursor() as cursor:
            for org in organisations:
                o = organisations[org][0]
                cursor.execute(OrganisationCommands.INSERT_ALL, (o.ID,
                                                                 o.role,
                                                                 o.name['cs']))
            self.connection.commit()

    def insert_speeches(self, speeches):
        """
        A method for inserting speec information into the database.

        Parameters:
        ----------- 
            speeches - dictionary
                A dictionary containing information about speeches.
                To see what information and how is the information being held
                see MetadataExtraction/speechParser.py
        """
        with self.connection.cursor() as cursor:
            for author in speeches:
                for s in speeches[author]:
                    cursor.execute(SpeechCommands.INSERT_ALL, (s.when,
                                                               str(s.tokens),
                                                               str(s.sentences),
                                                               str(s.named_entity_refferences),
                                                               s.speakerID[1:]))

            self.connection.commit()
