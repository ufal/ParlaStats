#!ur/bin/python3
import os
import argparse
import tqdm

from lxml import etree
import xml.etree.ElementTree as ET 
import xml.dom.minidom

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--source", type=str, default="../../list_of_organisations/", help="Directory with list(s) of organisations")

class PoliticalOrientation:
    """
    A class for grouping information about political orientation.

    Contains short description of political orientation 
    """
    orientation = str()
    def __init__(self, orientation):
        self.orientation = orientation

class Organisation:
    """
    A class for grouping relevant information about political organisations.

    Contains the information aobut name of the political party, xml:id for reference,
    the role of the political organisation, and possibly, but not mandatory information
    on political orientation (changes) through its existence
    """
    name = {}
    ID = str()
    role = str()
    def __init__(self, ID, role):
        self.name = {}
        self.ID = ID
        self.role = role
        self.orientation_records = []


class organisationParser:
    source_dir = str()
    organisations = dict()

    def __init__(self, args):
        self.source_dir = args.source
        self.organisations = {}
        self.interesting_files = os.listdir(self.source_dir)
        self.parser = etree.XMLParser(recover=True)

    def extractMetadata(self):
        """
        A method for extracting metadata about organisations from .xml files.

        So far able to read basic information about organisations:
            orgID - org's xml:id attribute.
            
            orgNames
                Reads all instances of the orgName tag and stores extracted information
                into Organisation name dictionary in a following way:
                    if orgName's full attribute is yes, then the key-value pair (nameLang, name) is stored
                    else if orgName's full attribute is abb, then the key-value pair ("abb", name) is stored
                    else nothing is stored (may cause some issues, if needed, handling will be added)
        
            pOrientation
                Checks if state tag is present within the tag org, if yes:
                    Checks if type of the state tag is politicalOrientation, if yes:
                        tries to find the ana attribute, if success:
                            stores the value of the ana atrribute as political orientation entry into 
                            the Organisation instance.
                        else informs about missing political orientation information
                    else informs about missing political orientation information
                else informs about missing political orientation ifnormation

                So far does not remember the time period from when to when did the organisation have
                certain political orientation, if needed it will be added, but this is mainly related to parties
                and I assume it is not that common that certain political party changes its orientation (assume!)
                if wrong, will be adjusted.
        """
        for file in tqdm.tqdm(self.interesting_files, leave=False, desc="Iterating thorugh Organisations"):
            domtree = xml.dom.minidom.parse(f"{self.source_dir}/{file}")
            listOrg = domtree.documentElement
            lang = listOrg.getAttribute("xml:lang")
            organisations = listOrg.getElementsByTagName('org')

            for organisation in tqdm.tqdm(organisations, leave=False, desc="Iterating through organisations"):
                orgID = organisation.getAttribute("xml:id")
                role = organisation.getAttribute("role")
                
                org = Organisation(orgID, role)
                
                #Parse name entries
                orgNames = organisation.getElementsByTagName('orgName')
                for orgName in orgNames:
                    full = orgName.getAttribute("full")
                    nameLang = orgName.getAttribute("xml:lang")
                    if "yes" == full:
                        org.name[nameLang] = orgName.childNodes[0].nodeValue
                    elif "abb" == full:
                        org.name["abb"] = orgName.childNodes[0].nodeValue
                
                #Parse orientation_records
                states = organisation.getElementsByTagName('state')
                if states:
                    for state in states:
                        state_type = state.getAttribute('type')
                        if "politicalOrientation" == state_type:
                            pOrientation = state.getElementsByTagName('state')[0].getAttribute('ana')
                            if pOrientation:
                                org.orientation_records.append(PoliticalOrientation(pOrientation))
                            else: 
                                org.orientation_records.append("Missing information on political orientation.")
                else:
                    org.orientation_records.append("Missing information on political orientation.")
                self.organisations[orgID] = (org, lang)
        return self.organisations            
            

def main(args):
    orgParser = organisationParser(args)
    orgList = orgParser.extractMetadata()
    print("Done!")

if __name__ == "__main__":
    main(args_parser.parse_args())

