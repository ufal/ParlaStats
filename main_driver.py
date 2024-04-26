#!usr/bin/python3
import os
import argparse
import tqdm

from lxml import etree
import xml.etree.ElementTree as ET
import xml.dom.minidom

from MetadataExtraction.personParser import personParser
from MetadataExtraction.orgParser import orgParser


args_parser = argparse.ArgumentParser()
args_parser.add_argument("--root", type=str, default="../../corpus", help="Path to the corpus root file.")

class mainDriver:
    def __init__(self, args):
        self.source = args.root
    
    def __parse_persons_file(self, file, country_code):
        person_parser = personParser(file, country_code)
        persons = person_parser.extractMetadata()
        return persons

    def __parse_orgs_file(self, file, country_code):
        org_parser = orgParser(file, country_code)
        organisations = org_parser.extractMetadata()
        return organisations
    
    def main(self):
        """
        Entry point for extracting te data.
        
        Loads the corpus root and finds references to the relevant files, 
        from which metadata on persons and organisations 
        (and eventualy transcripts) should be read.

        For further information on this process see the scripts
        in MetadataExtraction directory.
        """
        domtree = xml.dom.minidom.parse(self.source)
        teiCorpus = domtree.documentElement
        country_code = self.source[self.source.index('-'):self.source.index('.')]
        teiHeader = domtree.getElementsByTagName('teiHeader')[0]
        profileDesc = teiHeader.getElementsByTagName('profileDesc')[0]
        particDesc = profileDesc.getElementsByTagName('particDesc')[0]
        includes = particDesc.getElementsByTagName('xi:include')
        
        persons_file = includes[0].getAttribute("href")
        organisations_file = includes[1].getAttribute("href")

        persons = self.parse_persons_file(persons_file, country_code)
        organisations = self.parse_orgs_file(organisations_file, country_code)


def main(args):
    d = mainDriver(args)
    d.main()


if __name__ == "__main__":
    main(args_parser.parse_args())
