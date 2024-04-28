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

    def __get_token_count(self, speech):
        """
        A helper method for finding the token count in a given speech.

        Count the <w> tag in each <s> tag in each <seg> tag of the given
        <u> element, which I understand is element containing the transcript of one speech.
        Eventually this method along with __get_sentence_count() and __get_named_entities_refference_count()
        may get merged into one as these will be called quite a lot. For now though i keep them separated
        so it is (I think) easier to observe how the file is being processed.

        Parameters:
        -----------
            speech - <u> element of the Par-Czech transcript .xml file

        Returns:
        --------
            cout of the <w> tag in given speech
        """
        tokens_count = 0
        segments = speech.getElementsByTagName('seg')
        for segment in segments:
            sentences = segment.getElementsByTagName('s')
            for sentence in sentences:
                tokens = sentence.getElementsByTagName('w')
                tokens_count += len(tokens)
        return tokens_count

    
    def __get_sentence_count(self, speech):
        """
        A helper method for finding the token count in a given speech,
        
        Count the <s> tags in each <seg> tag of the given <u> element, 
        which I understand to be the element containing the transcript of one speech.
        Eventually this method, along with __get_token_count() and __get_named_entities_refference_count()
        may get merged into one.

        Parameters:
        -----------
            speech - <u> element of the Par-Czech transcript .xml file

        Returns:
        --------
            count of the <s> tag in given speech
        """
        sentence_count = 0
        segments = speech.getElementsByTagName('seg')
        for segment in segments:
            sentences = segment.getElementsByTagName('s')
            sentence_count += len(sentences)
        
        return sentence_count

    def __get_named_entities_refference_count(self, speech):
        """
        A helper method finding named_entity_refferences in a given speech.

        Count the <name> tags which are marked to be named entities by annotations.
        Eventually this method, along with __get_token_count() and __get_sentence_count()
        may get merged into one.

        Parameters:
        -----------
            speech - <u> element of the Par-Czech transcript .xml file

        Returns:
        --------
            count of the <name> tags annotated to be named entities.
        """
        named_entity_refference_count = 0
        segments = speech.getElementsByTagName('seg')
        for segment in segments:
            sentences = segment.getElementsByTagName('s')
            for sentence in sentences:
                tokens = sentence.getElementsByTagName('name')
                named_entity_refference_count += len(tokens)
        return named_entity_refference_count                

    def __process_file(self, filePath):
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
        root = xml.dom.minidom.parse(filePath)
        teiHeader = root.getElementsByTagName('teiHeader')[0]
        fileDesc = teiHeader.getElementsByTagName('fileDesc')[0]
        sourceDesc = fileDesc.getElementsByTagName('sourceDesc')[0]
        bibl = sourceDesc.getElementsByTagName('bibl')[0]
        date = bibl.getElementsByTagName('date')[0]
        when = date.getAttribute('when')
        
        # Extract other information
        text = root.getElementsByTagName('text')[0]
        body = text.getElementsByTagName('body')[0]
        div = body.getElementsByTagName('div')[0]
        utterances = div.getElementsByTagName('u')
        
        for u in utterances:
            speaker = u.getAttribute('who')
            utterance_id = u.getAttribute('xml:id')
            
            tokens_count = self.__get_token_count(u)
            sentences_count = self.__get_sentence_count(u)
            named_entities_count = self.__get_named_entities_refference_count(u)
            
            ut = Speech(tokens_count, sentences_count, named_entities_count, utterance_id, speaker, when)
            if not speaker in result.keys():
                result[speaker] = [ut]
            else:
                result[speaker].append(ut)
        
        return result
    
    def __dump_contents(self, contents):
        for key in contents.keys():
            with open(f"speeches_{key}.txt", 'a') as output:
                for speech in contents[key]:
                    print(speech, file=output)
                    print("###", file=output)
        

    def parseSpeeches(self):
        """
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
