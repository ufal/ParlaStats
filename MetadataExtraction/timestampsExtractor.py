#!usr/bin/python3
import argparse
from lxml import etree
import os
import xml.dom.minidom
import tqdm
from multiprocessing.pool import ThreadPool as Pool
args_parser = argparse.ArgumentParser()
args_parser.add_argument("--script", type=str, default="timestampsCSV.xslt", help="XSLT script to be applied")
args_parser.add_argument("--corpus_root", type=str, default="../../ParCzech.TEI.ana/ParCzech.ana.xml", help="Path to the directory containing the xml source.")
args_parser.add_argument("--specific_file", type=str, default="ps2013-001-01-000-999.ana.xml", help="Specific file to be transformed")


class timestampsExtractor:
    """
    A class responsible for extracting the timestamps from the corpus xml source files.
    """
    def __init__(self, corpus_root, script):
        """
        Attributes:
        -----------
            corpus_location - path to the corpus directory, that will not change when running.
            used_script - parsed XSLT script, one script will be applied to each source.
        """
        self.corpus_root = corpus_root
        self.corpus_dir = os.path.dirname(self.corpus_root)

        script_source = script
        xslt_script = etree.parse(script_source)

        self.apply_script = etree.XSLT(xslt_script)
    
    def transformFileCSV(self, filepath):
        
        xml_file = filepath
        xml_tree = etree.parse(xml_file)
        result = self.apply_script(xml_tree)
        with open("transformedCSV.csv", 'wb') as f:
            f.write(result)

    def extractTimestamps(self):
        """
        Pass through each transcript file and extract the timestamps
        """
        teiCorpus = xml.dom.minidom.parse(self.corpus_root)
        transcript_files = teiCorpus.getElementsByTagName('xi:include')
    
        for elem in tqdm.tqdm(transcript_files, leave=False, desc="Iterating thorugh transcript files."):
            ref = elem.getAttribute("href")
            filepath = self.corpus_dir + "/" + ref
            self.transformFileCSV(filepath)
        
            
def main(args):
    tsExtractor = timestampsExtractor(args.corpus_root, args.script)
    tsExtractor.transformFileCSV(f"../../ParCzech.TEI.ana/ps2013-001/{args.specific_file}")
    # tsExtractor.extractTimestamps()
    print(args.script)
    print("Done!")


if __name__=="__main__":
    main(args_parser.parse_args())
