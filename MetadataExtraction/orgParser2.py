#!usr/bin python3
import os
import argparse
import tqdm
from lxml import etree
import xml.etree.ElementTree as ET
import xml.dom.minidom
import csv

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--source", type=str, default="../../ParCzech.TEI.ana/ParCzech-listOrg.xml")

class PoliticalOrientation:
    """
    A class for grouping information about political orientation.
    
    Contains short description of political orientation, if it exists.
    """
    orientation = str()

    def __init__(self, orientation):
        self.orientation = orientation
       
class Organisation:
    """
    A class for grouping relevant information about political organisations.

    Contains the information about name of the political organisation,
    the role of the political organisation ad possibly, nut not mandatory information
    on political orinetation.
    """
    name={}
    ID = str()
    role = str()
    
    def __init__(self, ID, role, name):
        self.name = name
        self.ID = ID
        self.role = role
        self.orientation_records = []

class orgParser2:
    """
    A class that facilitates the extraction of organization metadata from 
    corpus source files.
    """
    def __init__(self, source, country_code):
        self.source_tree = etree.parse(source)
        self.transformations = [ etree.XSLT(etree.parse("MetadataExtraction/organisations.xslt")) ]
        self.out_files = ["MetadataExtraction/organisations.csv"]
        self.organisations = {}
        self.country_code = country_code
    
    def __transformFileToCSV(self, script, out_file):
        """
        Pre-process by applying XSLT script 
        """
        result = script(self.source_tree)
        with open(out_file, "wb") as f:
            f.write(result)

    def __store_organisations(self):
        """
        Parse the CSV result of XSLT transformation
        """
        with open(self.out_files[0], 'r', encoding="utf-8") as csv_file:
            reader = csv.DictReader(csv_file)
            rows = list(reader)
            col_names = reader.fieldnames
            for row in rows:
                name = { col_names[2]:row[col_names[2]],
                         col_names[3]:row[col_names[3]],
                         col_names[4]:row[col_names[4]] }

                org = Organisation(row["ID"], row["role"], name)
                org.orientation_records.append(row["orientation"])
                self.organisations[row["ID"]] = (org, self.country_code)

    def pipeline(self):
        print("--Extracting organisations--")
        self.__transformFileToCSV(self.transformations[0], self.out_files[0])
        self.__store_organisations()
        print("---DONE---")
        return self.organisations

def main(args):
    op = orgParser2(args.source, "cs")
    op.pipeline()

if __name__ == "__main__":
    main(args_parser.parse_args())
