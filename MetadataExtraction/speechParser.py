#!usr/bin/python3

import os
import argparse
import tqdm

from collections import defaultdict
from lxml import etree
import xml.etree.ElementTree as ET 
import xml.dom.minidom

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--source", type=str, default="../../ParCzech.TEI.ana/", help="Path to corpus.")


class Document:
    fileName = str()
    country_code = str()
    def __init__(self, fileName, country_code):
        self.fileName = fileName
        self.country_code = country_code

class Speech:
    tokens = int()
    sentences = int()
    named_entity_refferences = int()
    speakerID = str()
    when = str()
    
    def __init__(self, tokens, sentences, NE_refs, speech_id, speaker, when):
        self.tokens = tokens
        self.sentences = sentences
        self.named_entity_refferences = NE_refs
        self.speechID = speech_id
        self.speakerID = speaker
        self.when = when

    def __str__(self):
        result = f"***\nSpeech {self.speechID} given by {self.speakerID} at {self.when}\ntokens: {self.tokens}\nsentences: {self.sentences}\nnamed entity refferences: {self.named_entity_refferences}\n***\n"
        return result

class speechParser:
    def __init__(self, source_dir):
        self.source_dir = source_dir
        self.current_file = ""
        self.corpus_root = self.source_dir + "ParCzech.ana.xml"
    
    def __get_relevant_tags_count(self, speech):
        """
        Merged method for extracting the counts of sentences, tokens and named entity
        refferences from given utterance.

        Parameters:
        -----------
            speech - <u> element of the Par-Czech transcript .xml file

        Returns:
            count of the <w> tags within the utterance.
            count of the <s> tags within the utterance.
            count of the <name> tags within the utterance.
        --------
            
        """

        named_entity_refferences_count = 0
        tokens_count = 0
        sentences_count = 0
        segments = speech.findall('.//seg', speech.nsmap)
        for segment in segments:
            sentences = segment.findall('.//s', speech.nsmap)
            sentences_count += len(sentences)
            for sentence in sentences:
                tokens = sentence.findall('.//w', speech.nsmap)
                named_entities = sentence.findall('.//name', speech.nsmap)
                tokens_count += len(tokens)
                named_entity_refferences_count += len(named_entities)

        return tokens_count, sentences_count, named_entity_refferences_count
    
    def process_file(self, filePath):
        """
        A method for extracting speech information from singular file.
        
        Parameters:
        -----------
            filePath - path to the file to be parsed

        Returns:
        --------
            result - dictionary where keys are IDs of speakers and values are lists of speeches
        """
        # Extract the information on hwen the speech was given
        result = defaultdict()
        root = (etree.parse(filePath)).getroot()
        namespace = '{'+str(list(root.nsmap.values())[0])+'}'
        if root.tag == f"{namespace}TEI":
            date = root.find('.//teiHeader/profileDesc/settingDesc/setting/date', root.nsmap)
            when = date.get('when')
            
            
            # Extract other information
            utterances = root.findall(".//text/body/div/u", root.nsmap)
        
            for u in utterances:
                speaker = u.get('who')
                utterance_id = u.get('{http://www.w3.org/XML/1998/namespace}id', root.nsmap)
            
                tokens_count, sentences_count, named_entities_count = self.__get_relevant_tags_count(u)

                ut = Speech(tokens_count, sentences_count, named_entities_count, utterance_id, speaker, when)
                if not speaker in result.keys():
                    result[speaker] = [ut]
                else:
                    result[speaker].append(ut)
        
            return result
        return None
    
    def __dump_contents(self, contents):
        """
        FOR DEBUG PURPOSES, TECHNICALLY NO LONGER NEEDED.

        Method for dumping the extracted speech information into the text file.
        """
        for key in contents.keys():
            with open(f"speeches_{key}.txt", 'a') as output:
                for speech in contents[key]:
                    print(speech, file=output)
                    print("###", file=output)
        

    def parseSpeeches(self):
        """
        FOR DEBUG PURPOSES, TECHNICALLY NO LONGER NEEDED. 

        Main method for iterating through .xml files of ParCzech corpus
        and extracting information about individual speeches.

        So far cares about elements:
            Count of tokens.
            Count of sentences.
            Count fo named entities references.
            PersonID of the speaker who gave the speech.
            When was the speech given.
        
        Idea so far, make multiple files, each for one speaker, where I store the speeches given by the speaker.
        After extracting the information from one file, append all read speeches into the corresponding (so far)
        text file.
        """
        teiCorpus = xml.dom.minidom.parse(self.corpus_root)
        transcript_files = teiCorpus.getElementsByTagName('xi:include')
        for elem in tqdm.tqdm(transcript_files, leave=False, desc="Iterating through transcript files:"):
            ref = elem.getAttribute('href')
            if ref[0:2] == "ps":
                filePath = self.source_dir + elem.getAttribute('href')
                contents = self.__process_file(filePath)
                self.__dump_contents(contents)

def main(args):
    sp = speechParser(args.source)
    sp.parseSpeeches()
if __name__ == "__main__":
    main(args_parser.parse_args())
