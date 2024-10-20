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
args_parser.add_argument("--file", type=str, default="../../ParCzech.TEI.ana/ps2013-001/ps2013-001-01-000-999.ana.xml")
args_parser.add_argument("--wd", type=str, default="MetadataExtraction", help="Directory, where to look for XSLT scripts and CSV byproducts.")

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
        self.unaligned_tokens = None
        self.time_spoken = None
        self.time_silent = None
        self.time_unknown = None

    def loadTimestampsInfo(self, timestamps_info):
        self.earliest_timeline = timestamps_info[0]
        self.latest_timeline = timestamps_info[1]
        self.total_duration = timestamps_info[2]
        self.unaligned_tokens = timestamps_info[3]
        self.time_spoken = timestamps_info[4]
        self.time_silent = timestamps_info[5]
        self.time_unknown = max(0,self.total_duration - self.time_spoken - self.time_silent)
    
    def __str__(self):
        result ="---SPEECH---\n"
        result += f"ID: {self.speechID}\n"
        result += f"author: {self.speakerID}\n"
        result += f"role: {self.role}\n"
        result += f"when: {self.when}\n"
        result += f"tokens: {self.tokens}\n"
        result += f"sentences: {self.sentences}\n"
        result += f"named entity refferences: {self.named_entity_refferences}\n"
        result += f"total duration: {self.total_duration}\n"
        result += f"total spoken: {self.time_spoken}\n"
        result += f"time silent: {self.time_silent}\n"
        result += f"time unknown: {self.time_unknown}\n"
        result += f"unaligned tokens: {self.unaligned_tokens}\n"
        result += f"earliest timeline: {self.earliest_timeline}\n"
        result += f"latest timeline: {self.latest_timeline}\n"
        return result

class speechParser2:
    def __init__(self, directory="MetadataExtraction"):
        self.transformations = [(etree.XSLT(etree.parse(f"{directory}/speeches.xslt")), f"{directory}/speeches.csv"),
                                (etree.XSLT(etree.parse(f"{directory}/timestampsCSV.xslt")),f"{directory}/timestamps.csv")]

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
                    utterance.loadTimestampsInfo(timestamps_info[current_speech])
                    
                if (not row["personID"] in result):
                    result[row["personID"]] = [utterance]
                else:
                    result[row["personID"]].append(utterance)
                current_speech += 1
        return result

    def __processTimestampsCSV(self):        
        results = []
        with open(self.transformations[1][1], 'r', encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            current_speaker = None
            total_spoken = 0
            total_duration = 0
            intervals = []
            times = []
            unaligned_tokens = 0
            time_silent = 0
            rows = list(reader)
            actual_timeline = None
            previous_end = None
            for row in rows:
                if row['Type'] == 'S':
                    if current_speaker == None:
                        current_speaker = row['ID'][1:]
                    else: 
                        if len(intervals) > 0:
                            total_duration += self.__get_total_duration_ms(intervals)
                        # if Timelines are missing
                        if len(times) < 1:
                            results.append([None, None, total_duration, unaligned_tokens, 
                                            total_spoken, time_silent])
                        else:
                            leftovers = self.__get_total_duration_ms(intervals)
                            if (leftovers > 0 and len(times) >= 1):
                                total_duration += leftovers
                            results.append([times[0], times[-1], total_duration,unaligned_tokens, 
                                            total_spoken, time_silent])
                        total_spoken = 0
                        intervals = []
                        times = []
                        actual_timeline = None
                        unaligned_tokens = 0
                        total_duration = 0
                        time_silent = 0
                        previous_end = None
                elif row['Type'] == 'T':
                    if ((row['Time'] != actual_timeline) and (row['Time'] != '')):
                        actual_timeline = row['Time']
                        times.append(actual_timeline)
                        total_duration += self.__get_total_duration_ms(intervals)
                        previous_end = None
                        intervals = []

                    if (row['Begin'] and row['End']):
                        if previous_end != None:
                            time_silent += float(row['Begin']) - float(previous_end)
                        intervals.append(row['Begin'])
                        intervals.append(row['End'])
                        total_spoken += float(row['End']) - float(row['Begin'])
                        previous_end = row['End']
                    else:
                        unaligned_tokens += 1
                        previous_end = None
                                
            
        return results

    def __get_total_duration_ms(self, speech_timestamps):
        if (len(speech_timestamps) < 1):
            return 0
        return float(speech_timestamps[-1]) - float(speech_timestamps[0])


    def pipeline(self, file):
        for transformation in self.transformations:
            self.__transformFileToCSV(transformation, file)
        result = self.__processSpeechesCSV()
        return result

def main(args):
    out = ""
    # print(args.file)
    sp = speechParser2(args.wd)
    res = sp.pipeline(args.file)
    for r in res.keys():
        for s in res[r]:
            out += str(s)
    return out
if __name__ == "__main__":
    print(main(args_parser.parse_args()))
