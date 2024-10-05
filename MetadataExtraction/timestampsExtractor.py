#!usr/bin/python3
import argparse
from lxml import etree
import os
import xml.dom.minidom
import tqdm
from multiprocessing.pool import ThreadPool as Pool
import csv

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--script", type=str, default="timestampsCSV.xslt", help="XSLT script to be applied")
args_parser.add_argument("--corpus_root", type=str, default="../../ParCzech.TEI.ana/ParCzech.ana.xml", help="Path to the directory containing the xml source.")
args_parser.add_argument("--specific_file", type=str, default="ps2013-001-01-002-002.ana.xml", help="Specific file to be transformed")


class timestampsExtractor:
    """
    A class responsible for extracting the timestamps from the corpus xml source files.
    """
    def __init__(self, corpus_root, script):
        """
        Attributes:
        -----------
            corpus_root - path to the corpus root.
            apply_script - parsed XSLT script, one script will be applied to each source.
            corpus_dir - the name of the directory, wheere the corpus root is stored.
            speakers - a dictionary containing the IDs of speakers as keys and
                       total time of their speeches in ms as values.        
        """
        self.corpus_root = corpus_root
        self.corpus_dir = os.path.dirname(self.corpus_root)

        script_source = script
        xslt_script = etree.parse(script_source)

        self.apply_script = etree.XSLT(xslt_script)

        # THIS IS HARD-CODED JUST FOR NOW
        # After the methods, speakers dictionary shall be provided
        # as a parameter when creating the timestampsExtractor object
        # by the personParser.
        self.speakers = { "MiroslavaNemcova.1952":0,
                          "LubomirZaoralek.1956":0 }
        
        self.missing_timestamps_file = "TokensMissingAnchors.csv"
        with open("TokensMissingAnchors.csv", 'a') as f:
            f.write("ID\n")

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

    def process_speeches(self, file_out):
        """
        Method for separating the timestamps of different speeches in the output of the 
        transformation XSLT script.

        Iterates over the entries in the CSV file and separates the speeches in case there were multiple
        in the source XML file.

        Parameters:
        -----------
        file_out - output of the @transformFileCSV method.
        """
        results = []
        with open(file_out, 'r', encoding="utf-8")as csvfile:
            reader = csv.DictReader(csvfile)

            current_speech=1      # Make bunch of variables, which
                                  # will serve as temporary storage
                                  # for current speech number, speakers
            speakers_in_file = [] # encountered in a singular transcript file
            rows=list(reader)     # etc.
            intervals = []
            times = []
            actual_timeline=None
            for row in rows:
                # Extract the list of speakers
                if (actual_timeline != row['Time']):
                    if (row['Time'] != ''):
                        actual_timeline = row['Time']
                        times.append(actual_timeline)
                    
                if (row['Type'] == 'S'):
                    if row['ID'] not in speakers_in_file:
                        speakers_in_file.append(row['ID'][1:])
                    
                elif(row['Type'] == 'T'):                        # If the entry is representing
                    if (int(row['Speech']) == current_speech):   # a token in a current speech,
                                                                 #store the token's timestamps.
                        if (row['Begin'] and row['End']):        # If a token misses one or both
                            intervals.append(row['Begin'])       # timestamps, report it to the
                            intervals.append(row['End'])         # log file.
                        else:
                            with open(self.missing_timestamps_file, 'a') as f:
                                f.write(row['ID'] + ',\n')

                    else:
                        self.speakers[speakers_in_file[current_speech]] += self.__get_total_duration(intervals)
                        
                        if (len(times) != 1):
                            results.append([times[0], times[-1], self.__get_total_duration(intervals)])
                        else:
                            results.append([times[0], times[0], self.__get_total_duration(intervals)])
                        
                        current_speech += 1
                        intervals = []
                        times = [actual_timeline]
                
            # print(self.speakers)
            return results 
   
    def __get_total_duration(self,  speech_timestamps):
        """
        Method responsible for getiing the total duration of the given speech
        by interval information form timestamps.
        
        Duration is considered the difference between the beginning of the first token up until the 
        end of the last token of the speech. It is measured in miliseconds.

        So far the calculation is pretty simple, can be extended / modified later.

        Parameters:
        -----------
        speech_timestamps - timestamps for the currently examined speech (CSV file or raw, not decided yet)
        """
        # print(speech_timestamps)
        return abs(float(speech_timestamps[-1]) - float(speech_timestamps[0]))


def main(args):
    tsExtractor = timestampsExtractor(args.corpus_root, args.script)
    tsExtractor.transformFileCSV(f"../../ParCzech.TEI.ana/ps2013-001/{args.specific_file}")
    print(tsExtractor.process_speeches("transformedCSV.csv"))
    # tsExtractor.extractTimestamps()
    # print(args.script)
    print("Done!")


if __name__=="__main__":
    main(args_parser.parse_args())
