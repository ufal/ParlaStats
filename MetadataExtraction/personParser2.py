import argparse
from lxml import etree
import os
import xml.dom.minidom
import tqdm
import csv

args_parser=argparse.ArgumentParser()
# args_parser.add_argument("--script", type=str, help="XSLT script to be applied")
args_parser.add_argument("--source", type=str, default="../../ParCzech.TEI.ana/ParCzech-listPerson.xml", 
                         help="Path to the listPerson file")

class Affiliation:
    """
    A class for grouping the information about speaker party affiliation.

    Contains information on since to when the speaker was saffiliated with given party and
    what role did the person hold within the oragnisation.
    All values of attributes are the values of attributes within the <affiliation> tag in the parla-mint
    listPerson files.
    """
    since=str()
    to=str()
    role=str()
    party=str()

    def __init__(self, since=None, to=None, role=None, party=None):
        self.since = since
        self.party = party
        self.role = role
        self.to = to

class PersonName:
    """
    A class for grouping information about names of the speakers.

    Contains information on surname, forename (mandatory) and since to, addname (non-mandatory)
    where since and to describe a time period for this naming of a person.
    """
    since=str()
    to=str()
    surname=str()
    forename=str()
    addname=str()
    def __init__(self,id=None, since=None, to=None, surname=None, forename=None, addname=None):
        self.id = id
        self.since = since
        self.to = to
        self.surname = surname
        self.forename = forename
        self.addname = addname

class Person:
    """
    A class for grouping information about speakers.

    Contains information on person ID (mandatory) sex (may be missing), birth (may be missing)
    Also contains a list of name records of the person and a list of affiliation records.

    Attributes:
    -----------
    personID(str):
        Unique identificator of a speaker.
    sex (str):
        Gender of a speaker.
    birth (str):
        Birth date of a speaker.
    name_records([PersonName]):
        Names that person has / had in the past.
    affiliation_records([Affiliation]):
        Affiliations that this speaker had throughout their career.
    """
    personID = str()
    sex = str()
    birth = str()

    def __init__(self, personID, sex, birth):
        self.personID=personID
        self.sex=sex
        self.birth=birth
        self.name_records=[]
        self.affiliation_records=[]

    def add_name_record(self,name):
        """
        Method for adding a nemr record for a person (after marriage, etc.)

        Parameters:
        -----------
        name(PersonName):
            new name record.        
        """
        if (name.since == ''):
            if (self.birth != ''):
                name.since=self.birth
            else:
                name.since=None
        if (name.to == ''):
            name.to=None
        self.name_records.append(name)

    def add_affiliation_record(self, affiliation):
        """
        Method for adding an affiliation record to a person

        Parameters:
        -----------
        affiliation(Affiliation):
            new affiliation record.
        """
        if (affiliation.to == ''):
            affiliation.to = None
        self.affiliation_records.append(affiliation)

class personParser2:
    """
    An improved(?) version of the foremr personParser.
    Major change is that this personParser uses XSLT scripts to extract the metadata about speakers.
    """
    def __init__(self, source, corpus):
        """
        Parameters:
        -----------
            source(str) - path to the listPerson file.
        """
        self.source_tree = etree.parse(source)
        
        self.transformations = [ etree.XSLT(etree.parse("MetadataExtraction/personGeneral.xslt")),
                                 etree.XSLT(etree.parse("MetadataExtraction/personNameRecords.xslt")),
                                 etree.XSLT(etree.parse("MetadataExtraction/personAffiliations.xslt")) ]
        
        self.out_files = ["MetadataExtraction/personGeneral.csv",
                          "MetadataExtraction/personNameRecords.csv",
                          "MetadataExtraction/personAffiliations.csv"]

        self.person_dictionary = {}
        self.name_id = 0
        self.corpus = corpus

    def __transformFileToCSV(self, script, out_file):
        """
        A method for transforming the given XML source to CSV output.
        Parameters:
        -----------
            script(str) - Path to the script, which is to be used to transform the XML
        """
        result = script(self.source_tree)
        with open(out_file, "wb") as f:
            f.write(result)
    
    def __store_general(self):
        with open(self.out_files[0], 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            for row in rows:
                self.person_dictionary[row['ID']] = Person(row['ID'],row['Sex'],row['Birth'])
    
    def __store_name_records(self):
        with open(self.out_files[1], 'r', encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            for row in rows:
                self.person_dictionary[row['ID']].add_name_record(PersonName(self.name_id,row["since"], row["to"],
                                                                             row["surname"], row["forename"]))

    def __store_affiliation_records(self):
        with open(self.out_files[2], 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            for row in rows:
                self.person_dictionary[row['ID']].add_affiliation_record(Affiliation(row['from'], row['to'], row['role'], row['orgID']))

    def pipeline(self):
        """
        A main method for extracting all information about speakers.
        """
        print("---Extracting persons---")
        for i in range(len(self.transformations)):
            self.__transformFileToCSV(self.transformations[i], self.out_files[i])
            
        self.__store_general()
        self.__store_name_records()
        self.__store_affiliation_records()
        
        for key in self.person_dictionary.keys():
            self.person_dictionary[key] = [self.person_dictionary[key], self.corpus]
        print("---DONE---")
        return self.person_dictionary
        
def main(args):
    person_parser = personParser2(args.source)
    person_parser.pipeline()

if __name__ == "__main__":
    main(args_parser.parse_args())