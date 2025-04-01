#!usr/bin/python3
import os
import argparse
import tqdm

from lxml import etree
import xml.etree.ElementTree as ET
import xml.dom.minidom

# LEGACY METADATA EXTRACTION
from MetadataExtraction.personParser import personParser
from MetadataExtraction.orgParser import organisationParser
from MetadataExtraction.speechParser import speechParser

# NEW METADATA EXTRACTION
from MetadataExtraction.personParser2 import personParser2
from MetadataExtraction.orgParser2 import orgParser2
from MetadataExtraction.speechParser2 import speechParser2
from DatabaseCommunication.DatabaseTableCreator import DatabaseTableCreator
from DatabaseCommunication.DatabaseInserter import DatabaseInserter

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--root", type=str, default="../ParCzech.TEI.ana/ParCzech.ana.xml", help="Path to the corpus root file.")
args_parser.add_argument("--query_file", type=str, default=None, help="Path to the file with querries to run ")
args_parser.add_argument("--query_mode", action="store_true", help="Set this flag if you wish to present some queries to the database.")
args_parser.add_argument("--database", type=str, default="DatabaseCommunication/parczech4_0.ini", help="File with target database details")
args_parser.add_argument("--create_tables", action="store_true", help="Set this flag to create database tables.")
args_parser.add_argument("--legacy", action="store_true", help="Set this flag to use legacy (non-XSLT) metadata extraction")

class mainDriver:
    def __init__(self, args):
        self.corpus_root = args.root
        self.source = os.path.dirname(self.corpus_root)
        self.databaseInserter = DatabaseInserter(args.database)
        self.query_file = args.query_file
        self.database_config = args.database
        self.legacy = args.legacy

    def __parse_speech_files(self):
        speech_parser = None
        
        if self.legacy:
            speech_parser = speechParser(self.source + '/')
        else: 
            speech_parser = speechParser2()

        teiCorpus = xml.dom.minidom.parse(self.corpus_root)
        transcript_files = teiCorpus.getElementsByTagName('xi:include')
        for elem in tqdm.tqdm(transcript_files, leave=False, desc="Iterationg thorugh transcript_files"):
            ref = elem.getAttribute("href")
            if ref[0:2] == "ps":
                filePath = self.source + '/' + ref

                contents = None
                if self.legacy:
                    contents = speech_parser.process_file(filePath)
                else:
                    contents = speech_parser.pipeline(filePath)
                if contents:
                    self.databaseInserter.insert_speeches(contents)            
                
    def __parse_persons_file(self, file, source_corpus):
        persons = None
        
        if self.legacy:
            person_parser = personParser(file, source_corpus)
            persons = person_parser.extractMetadata()
        
        else:
            person_parser = personParser2(file,"MetadataExtraction", source_corpus)
            persons = person_parser.pipeline()
        
        return persons

    def __parse_orgs_file(self, file, source_corpus):
        organisations = None
        
        if self.legacy:
            org_parser = organisationParser(file, source_corpus)
            organisations = org_parser.extractMetadata()
        
        else:
            org_parser = orgParser2(file, source_corpus)
            organisations = org_parser.pipeline()
        
        return organisations
    
    #deprecated
    def __process_example_queries(self):
        """
        Exaple query loading method.

        Reads example querries from a text file.
        """
        relevant_lines = []
        with open(self.query_file, 'r') as q_in:
            lines = q_in.readlines()
            for line in lines:
                if line[0] == 'S':
                    relevant_lines.append(line)
        return relevant_lines

    def __initialize_database(self):
        """
        Database initialisation method.

        Creates the tables in database.
        """
        db_table_creator = DatabaseTableCreator(self.database_config)
        db_table_creator.create_tables()
    
    def main(self, create_tables):
        """
        Entry point for extracting te data.
        
        Loads the corpus root and finds references to the relevant files, 
        from which metadata on persons and organisations 
        (and eventualy transcripts) should be read.

        For further information on this process see the scripts
        in MetadataExtraction directory.
        """

        domtree = xml.dom.minidom.parse(self.corpus_root)
        teiCorpus = domtree.documentElement
        
        source_corpus = self.source[self.source.rfind('/')+1:]
        source_corpus = source_corpus[:source_corpus.index('.')]
        
        teiHeader = domtree.getElementsByTagName('teiHeader')[0]
        profileDesc = teiHeader.getElementsByTagName('profileDesc')[0]
        particDesc = profileDesc.getElementsByTagName('particDesc')[0]
        includes = particDesc.getElementsByTagName('xi:include')
        
        persons_file = self.source + '/' + includes[1].getAttribute("href")
        organisations_file = self.source + '/' + includes[0].getAttribute("href")
        persons = None
        organisations = None
        if create_tables:
            persons = self.__parse_persons_file(persons_file, source_corpus)
            organisations = self.__parse_orgs_file(organisations_file, source_corpus) 
            # Create the database tables if they are not created yet.
            self.__initialize_database()
            # Insert the information into database
            self.databaseInserter.insert_persons(persons)
            self.databaseInserter.insert_organisations(organisations)
            for person in persons:
                self.databaseInserter.insert_affiliation_records(persons[person][0].affiliation_records, person)

            self.__parse_speech_files()
        db_table_creator = DatabaseTableCreator(self.database_config)
        db_table_creator.create_materialized_view()
        return persons, organisations

def main(args):
    d = mainDriver(args)
    p,o = d.main(args.create_tables)
    # Uncomment below for debugging purposes
    """
    with open("Persons.txt", 'w') as out:
        for key in p.keys():
            print(p[key][0], file=out)
    with open("Organisations.txt", 'w') as out:
        for key in o.keys():
            print(o[key][0], file=out)
    """
if __name__ == "__main__":
    main(args_parser.parse_args())
