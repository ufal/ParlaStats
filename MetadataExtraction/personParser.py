#!usr/bin/python3

import os
import argparse
import tqdm

from lxml import etree
import xml.etree.ElementTree as ET
import xml.dom.minidom

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--source", type=str, default="../../list_of_persons", help="Direcroty with list(s) of persons.")


class Affiliation:
    """
    A class for grouping the information about speaker party affiliation.

    Contains information on since when to when the speaker was affiliated to given party
    and what role did the person hold within the party.
    All values of attributes are the values of attributes within the <affiliation> tag in the
    parla-mint listPerson files.
    """
    since = str()
    to = str()
    role = str()
    party = str()
    def __init__(self, since=None, to=None, role=None, party=None):
        self.since = since
        self.party = party
        self.role = role
        self.to = to
        

class PersonName:
    """
    A class for grouping information about names of the speakers.

    Contains information on surname, forename (mandatory) and since, to, addname (non-mandatory)
    where since and to describe a time period for this naming of a person.
    """
    since = str()
    to = str()
    surname = str()
    forename = str()
    addname = str()
    def __init__(self, since=None, to=None, surname=None, forename=None, addname=None):
        self.since = since
        self. to = to
        self. surname = surname
        self.forename = forename
        self.addname = addname

class Person:
    """
    A class for grouping information about speakers.
    
    Contains information on person ID (mandatory) sex (may be missing), birth (may be missing)
    All information which are missing have value Missing <information> entry
    Also contains a list of name records for person
    
    Attributes:
    -----------
    personID (str):
        Unique identificator of a speaker.
    sex (str):
        Gender of a speaker.
    birth (str):
        Birth date of a speaker
    name_records ([str]):
        Names that person has / had in the past.
    affiliation_records ([str]):
        Affiliations that this speaker had througout their career.
    """
    personID = str()
    sex = str()
    birth = str()
    def __init__(self, personID, sex, birth):
        self.personID = personID
        self.sex = sex
        self.birth = birth
        self.name_records = []
        self.affiliation_records = []

    def add_name_records(self, names):
        """
        Method for adding a name record for a person (after marriage, etc.)

        Parameters:
        -----------
            name ([PersonName]):
                new name records
        """
        for name in names:
            if name.since == '':
                name.since = self.birth
        self.name_records.append(name)

    def add_affiliation_record(self, affiliations):
        """
        Method for adding an affiliation records for a person

        Parameters:
        -----------
            affiliation ([Affiliation]):
                new affiliation records
        """
        if affiliations.to == '':
            affiliations.to = "present"
        self.affiliation_records.append(affiliations)

class personParser:
    source_dir = str()

    persons_dict = dict()
    def __init__(self, source, country_code):
        self.source_dir = source
        self.persons_dict = {}
        self.country_code = country_code   
    
    def __extractSex(self, person):
        """
        A helper method for finding the information on sex of the 
        given speaker.

        Parameters:
        -----------
            person - xml element in the Parla-Mint format.

        Returns:
        --------
            Value attribute of the 'sex' sub element of the person element 
            according to Parla-Mint format if 'sex' element is present, 
            otherwise informs of its absence.
        """
        personSex = person.getElementsByTagName('sex')
        if len(personSex) < 1:
            return "Missing information on sex."
        return personSex[0].getAttribute('value')

    def __extractBirth(self, person):
        """
        A helper method for finding the inforation on birth of the
        given speaker.

        Parameters:
        -----------
            person - xml element in the Paral-Mint format.

        Returns:
        --------
            Value of the 'when' attribute of the 'birth' sub element of the person element
            according to Parla-Mint format if 'birth' element is present,
            otherwise informs of its absence.
        """
        personBirth = person.getElementsByTagName('birth')
        if len(personBirth) < 1:
            return "Missing information on birth."
        return personBirth[0].getAttribute('when')
    
    def __extractNameRecords(self, person):
        """
        A helper method for extracting the name recors of the given speaker.

        Parameters:
        -----------
            person - xml element in the Parla-Mint format.
        
        Returns:
        --------
            List of name records for the given speaker including the information
            about time periods when these name records held.
        """
        person_name_records = person.getElementsByTagName('persName')
        names = []
        for name_record in person_name_records:
            since = name_record.getAttribute('from')
            to = name_record.getAttribute('to')
            surname = name_record.getElementsByTagName("surname")[0].childNodes[0].nodeValue
            forename = name_record.getElementsByTagName("forename")[0].childNodes[0].nodeValue
            addname = name_record.getElementsByTagName("addName")
            if len(addname) > 0:
                addname = addname[0].childNodes[0].nodeValue
            else: addname = ''
            name = PersonName(since, to, surname, forename, addname)
            names.append(name)
        return names

    def __extractAffiliationRecords(self, person):
        """
        A helper method for extracting the affiliation records the given speaker.

        Parameters:
        -----------
            person - xml element in Parla-Mint format.

        Returns:
        --------
            List of affiliation records for the given speaker including the time
            period of person-organisation affiliation.
        """
        affiliations = []
        person_affiliations = person.getElementsByTagName("affiliation")
        for person_affiliation in person_affiliations:
            since = person_affiliation.getAttribute("from")
            to = person_affiliation.getAttribute("to")
            role = person_affiliation.getAttribute("role")
            party = person_affiliation.getAttribute("ref")
            affiliation_instance = Affiliation(since, to, role, party)
            affiliations.append(affiliation_instance)
        
        return affiliations

    def extractMetadata(self):
        """
        Method for extracting metadata about speakers from .xml files.

        So far pretty rigid, may break when it encounters some anomaly.
        Later I will add some sort of anomaly logging system, which could
        catch these anomalies and either inform the user directly or store 
        them into some anomaly storage file.

        It iterates thorugh all files in list_of_persons_directory and processes
        each person tag in it.
        The process is:
            1. Get the person ID attribute from the person tag
            2. Find the birth subtag in the person tag and get it's when attribute
            3. Find the sex sibtag in the preson tag and get it's value attribute
            4. Find all instances of the persName tag and extract surname, forename and optional addName tags text values.
                4.1 Extract the optional from, to attributes for each persName as well 

            The process as it is, should be resistant to missing some data, which are not mandatory according to
            parla-mint format documentation.

        The processed persons are then stored in the persons_dict dictionary in the format:
            person's ID : (person, lang)

        If there are tags containing persons name in two languages, e.g. english and russian, they both are
        added to a persons name_records list. This may be modified in the future so the name_records do not contain
        entries, which are different only in language.

        """
        domtree = xml.dom.minidom.parse(self.source)
        listPerson = domtree.documentElement
        persons = listPerson.getElementsByTagName('person')
        for person in tqdm.tqdm(persons, leave=False, desc="Iterating through Persons"):
            personID = person.getAttribute("xml:id")
                
            # Extract birth information
            person_birth = self.__extractBrith(person)               
            
            # Extract sex information
            person_sex = self.__extractSex(person)
            
            # Create a person record
            person_instance = Person(personID, person_sex, person_birth)
                
            # Extracting name records for current person
            person_instance.add_name_records(self.__extractNameRecords(person))
                
            # Extracting affiliation records for person
            person_instance.add_affiliation_records(self.__extractAffiliationRecords(person))
            
            # Store into persons dictionary, eventually will be dumped into some file
            self.persons_dict[person_instance.personID] = (person_instance, self.country_code)
            
        return self.persons_dict  
                    
    
        

def main(args):
    # this no longer works - will take care later
    pp = personParser(args.source)
    pp.extractMetadata()

if __name__ == "__main__":
    main(args_parser.parse_args())



