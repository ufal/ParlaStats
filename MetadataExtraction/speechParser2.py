#!usr/bin/python3
import os
import argparse
import tqdm

from collections import defaultdict
from lxml import etree
import xml.etree.ElementTree as ET
import xml.dom.minidom
import csv

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--file", type=str, default="../ParCzech.TEI.ana/ps2013-001/ps2013-001-01-000-999.ana.xml")

class Speech:
    tokens = int()
    sentences = int()
    named_entity_references = int()
    speakerID = str()
    when = str()
    total_duration = int()
    earliest_timeline = str()
    latest_timeline = str()

    def __init__(self, tokens, sentences, NE_refs, role, speech_id, speaker, when):
        self.tokens = tokens
        self.sentences = sentences
        self.named_entity_refferences = NE_refs
        self.role = role
        self.speechID = speech_id
        self.speakerID = speaker
        self.when = when
        self.total_duration = None
        self.earliest_timeline = None
        self.latest_timeline = None

class speechParser2:
    def __init__(self):
        self.transformations = [(etree.XSLT(etree.parse("MetadataExtraction/speeches.xslt")), "MetadataExtraction/speeches.csv"),
                                (etree.XSLT(etree.parse("MetadataExtraction/timestampsCSV.xslt")),"MetadataExtraction/timestamps.csv")]

    def __transformFileToCSV(self, transformation, file):
        source_tree = etree.parse(file)
        result = transformation[0](source_tree)
        with open(transformation[1], "wb") as f:
            f.write(result)
    
    def __processSpeechesCSV(self):
        result = defaultdict()
        timestamps_info = self.__processTimestampsCSV()
        current_speech = 0
        with open(self.transformations[0][1], 'r', encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            for row in rows:
                utterance = Speech(row["tokenCount"],
                                   row["sentencesCount"],
                                   row["namedEntityCount"],
                                   row["role"],
                                   row["ID"],
                                   row["personID"],
                                   row["date"])
                
                if (len(timestamps_info) > 0):
                    utterance.earliest_timeline = timestamps_info[current_speech][0]
                    utterance.latest_timeline = timestamps_info[current_speech][1]
                    utterance.total_duration = timestamps_info[current_speech][2]
                
                if (not row["personID"] in result):
                    result[row["personID"]] = [utterance]
                else:
                    result[row["personID"]].append(utterance)
        
        return result

    def __processTimestampsCSV(self):        
        results = []
        with open(self.transformations[1][1], 'r', encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            current_speech = 1
            speakers_in_file = []
            rows = list(reader)
            intervals = []
            times = []
            actual_timeline = None
            for row in rows:
                if (actual_timeline != row['Time']):
                    if (row['Time'] != ''):
                        actual_timeline = row['Time']
                        times.append(actual_timeline)

                if (row['Type'] == 'S'):
                    if (row['ID'] not in speakers_in_file):
                        speakers_in_file.append(row['ID'][1:])

                elif (row['Type'] == 'T'):
                    if (int(row['Speech']) == current_speech):
                        if (row['Begin'] and row['End']):
                            intervals.append(row['Begin'])
                            intervals.append(row['End'])
                    else:
                        if (len(times) >= 1):
                            results.append([times[0], times[-1], self.__get_total_duration_ms(intervals)])
                        else:
                            results.append([None, None, self.__get_total_duration_ms(intervals)])
                        current_speech += 1
                        intervals = []
                        times = [actual_timeline]

            if (len(times) >= 1):
                results.append([times[0], times[-1], self.__get_total_duration_ms(intervals)])
                current_speech += 1
                intervals = []
                times = [actual_timeline]
            
        return results

    def __get_total_duration_ms(self, speech_timestamps):
        if (len(speech_timestamps) < 1):
            return 0
        return abs(float(speech_timestamps[-1]) - float(speech_timestamps[0]))


    def pipeline(self, file):
        for transformation in self.transformations:
            self.__transformFileToCSV(transformation, file)
        result = self.__processSpeechesCSV()
        return result

def main(args):
    sp = speechParser2()
    sp.pipeline(args.file)

if __name__ == "__main__":
    main(args_parser.parse_args())
