# Parlastats - Programmer documentation

## Contents
- **Metadata Extraction**
    - orgParser
        - PoliticalOrientation
        - Organisation
        - organisationParser
    - personParser
        - Affiliation
        - PersonName
        - Person
        - personParser
    - speechParser
        - Document
        - Speech
        - speechParser

## 1. Metadata Extraction
### 1.1 Organisation parser (orgParser.py)
- This file contains 3 classes (`PoliticalOrientation`, `Organisation`, `organisationParser`)
- `PoliticalOrientation` and `Organisation` are used to store the metadata about political organisations extracted by `organisationParser`
- #### 1.1.1 PoliticalOrientation
    - `PoliticalOrientation(orientation : str)`
    - Class for storing the information about political orientation record of some political organisation.
    - Contains short description of political orientation
    - **Attributes**:
        - `orientation` - Short description of the political orientation (`string`)
    - **Methods**:
        - `__str__()`
            - Modified conversion of the class to string for debugging purposes.
- #### 1.1.2 Organisation
    - `Organisation(ID : str, role : str)`
    - Class for storing the information about political organisation.
    - Contains the information about name of thepolitical party, xml:id (from .xml source) for the reference, the role of political organisation.
    - **Attributes:**
        - `name` - List of name records of the organisation in english and native language + abbreviation (`dict(str:str)`)
        - `ID` - ID of the organisation (`string`)
        - `role` - Role of the organisation within parliament (`string`)
        - `orientation_records` - List of orientation political orientations (`[PoliticalOrientation]`)
    - **Methods**:
        - `__str__()`
            - Modified conversion of the class to string for debugging purposes.
- #### 1.1.3 organisationParser
    - `organisationParser(source : str, country_code : str)`
    - A class responsible for extracting the organisation metdata from corpus xml files.
    - **Attributes**:
        - `source` - a path to the xml file which is to be parsed (`string`)
        - `country_code` - a conde of the country from the source `xml` file (`string`)
        - `organisations` - Dictionary for storing the extracted organisations.
            - `dict(ID:(Organisation, country_code))`
        - `parser` - a `xml` file parser (`lxml.etree.XMLParser`)
    - **Methods:**
        - **`__extractNameRecords(organisation)`**
            - A helper method for extracting the name record(s) of a give organisation
            - Name si extracted in both native and english if present, and an abbreviation is extracted as well if present.
            - *parameters*:
                - `organisation` - an 'org' xml element of the ParlaMint format.
            - *returns*:
                - A dictionary containing the name record(s) with the informationon the language the name is written in or an abbreviation.
                - `dict(str:str)`
        - **`__extractOrientationRecords(organisation)`**
            - A helper method for extracting information on political orientation.
            - If the information is present extracts it, if not warns about its absence.
            - *parameters*
                - `orgainsation` - an xml element of ParlaMint format.
            - *returns*
                - `orientation_records` - a list of `PoliticalOrientation` records.
        - **`extractMetadata()`**
            - A method for extracting the metadata about organisations from `.xml`files.
            - Reads all instances of the `orgName` tag and stores extracted inforamtion into `Organisation.name` dictionary in a following way:
                - if `orgName.full` is `yes`  then key-value pair (`nameLang`, `name`) is stored
                - if `orgName.full` is `abb` then key-value pair (`"abb"`, `name`) is stored
            - Political orientation records are extracted in following way:
                - Try to find the `state` tag within the `org` tag whose type is `politicalOrientation`
                - If found try to find the `ana` attribute.
                - If found, store it as `PoliticalOrientation` record into the `Organisation.orientation_records` list
            - Uses the `xml.dom.minidom` to parse the `xml` file (path in `source` attribute) and represent it using the Tree data structure.
            - Then finds all `org` tags within the `xml` file and iterates over them, calling the `__extractNameRecords()` and `__extractOrientationRecords()` for each `org` tag and stores the output of these helper methods into the `Organisation` object appropriately.z
            - *returns*
                - `organisations` - `orgParser`'s own attribute. 

## 1.2 Person parser(personParser.py) 
- This file contains 4 classes (`Affiliation`, `PersonName`, `Person`, `personParser`)
- Classes `Affiliation`, `PersonName`, `Person` are used to store the extracted metadata and class `personParser` is used to extract the metadata.
- ### 1.2.1 Affiliation
    - `Affiliation(since : str = None, to : str = None, role : str = None, party : str = None)`
    - A class used to store the information about affiliation record extracted from the corpus `xml` files.
    - Contains information on since when to when the speaker was affiliated with given party and what role did they hold there.
    - All values of the class's attributes are the values of attributes within the \<affiliation\> tag in the ParlaMint `listPeroson` files.
    - **Attributes:**
        - `since` - Beginning of the affiliation (`string`) YYYY-MM-DD.
        - `to`  - End of the affiliation (`string`) YYYY-MM-DD.
        - `role` - The role of the person within the organisation during the affiliation (`string`)
        - `party` - Organisation the speaker was affiliated to (`string` `Organisation.ID`)
    - **Methods:**
        - `__str__()`
            - Modified conversion of objects to strings for debugging purposes.
- ### 1.2.2 PersonName
    - `PersonName(id:str=None, since:str=None, to:str=None, surname:str=None, addname:str=None)`
    - A class for grouping the information about name record of a speaker.
    - Contains information on forename, surname (those two mandatory), addname and since when to when the speaker was named like this (May ahve changed due to marriage etc.)
    - **Attributes:**
        - `id` - Id of the person to whom the name record belongs (`string`).
        - `to` - End of the name record validity (`string`) YYYY-MM-DD.
        - `since` - Beginning of the name record validity (`string`) YYYY-MM-DD.
        - `forename` - Forename (`string`).
        - `addname` - Addname (`string`).
        - `surname` - Surname (`satring`).
    - **Methods:**
        - `__str__()`
            - Modified conversion of objects to strings for debugging purposes.
- ### 1.2.3 Person
    - `Person(personID:str, sex:str, birth:str)`
    - A class for grouping information about speakers.
    - Contains information on person ID (mandatory) gender (may be missing), birth (may be missing).
    - Those that are missing are stored as None.
    - Also contains a list of name and affiliation records.
    - **Attributes:**
        - `personID` - Unique identifier of the speaker extracted from the `listPerson` `xml` file. (`string`)
        - `sex` - Gender of a speaker, `M`-Male, `F`-Female, `U`- Unknown (`char`)
        - `birth` - Birth date of the speaker (`string`) YYYY-MM-DD.
        - `name_records` - List of the name records for the speaker (`[PersName]`)
        - `affiliation_records` - List of the affiliation records for the speaker (`[Affiliation]`)
    - **Methods**:
        - **`add_name_records(names)`**
            - A helper method for adding name records.
            - *parameters:*
                - `names` - name records to be added (`[PersonName]`)
        - **`add_affiliation_record(affiliations)`**
            - A helper method for adding affiliation records.
            - *parameters:*
                - `affiliations` - affiliations to be added (`[Affiliation]`)
        - `__str__()`
            - Modified conversion of objects to strings for debugging purposes.
- ### 1.2.4 personParser
    - `personParser(source:str, country_code:str)`
    - A class responsible for extracting the above described emtadata about speakers from the corpus `lisPerson` `xml` files.
    - **Attributes:**
        - `source` - Path to the `listperson` file (`string`).
        - `persons_dict` - A dirctionary for storing the extracted metadata in the form of key-value pairs `(Person.personID:(Person, country_code))`
        - `country_code` - Code of the country (`string`)
    - **Methods:**
        - **`__extractSex(person)`**
            - A helper method for finding the information about gender of the given speaker.
            - *parameters:*
                - `person` - xml element in the ParlaMint format. 
            - *returns:*
                - Value attribute of the 'sex' sub element of the person element according to the ParlaMint format (`string`).
                - If the `sex` sub-element is not present, informs about its absence.
        - **`__extractBirth(perosn)`**
            - A helper method for extracting the information about birth date of a given speaker.
            - *parameters:*
                - `person` - xml element in the ParlaMint format
            - *returns:*
                - Value of the `when` attribute of the `birth` sub element of the person element according to the ParlaMint format (`string`).
                - If the birth element is absent, returns `None`
        - **`__extractNameRecords(person)`**
            - A helper method for extracting the name records of a given speaker.
            - *parameters:*
                - `person` - xml element in the ParlaMint format.
            - *returns:*
                - List of the name record for the given speaker (`[PersonName]`)
        - **`__extractAffiliationRecords(person)`**
            - A helper method for extracting the affiliation records of given speaker.
            - *parameters:*
                - `person` - xml element i the ParlaMint format.
            - *returns*
                - List of affiliation records for given person (`[Affiliation]`)
        - **`extractMetadata()`**
            - Method for extracting metadata about speakers from the `listPerson` xml files.
            - It iterates through all `person` tags in the `listPerson` xml file in a following way:
                - $1.$ Get the person ID attribute from the person tag
                - $2.$ Find the `birth` sub-tag in the `person` tag and get its `when` attribute
                    - `__extractBirth()`
                - $3.$ Find the `sex` sub-tag and get its `value` attribute.
                    - `__extractSex()`
                - $4.$ Find all instances of the `persName` tag and extract `surname`, `forename` and `addname` tags text values.
                - $5.$ Find all instances of the `affiliation` tag and extract the relevant information from them.
            - The processed persons are then stored in the `person_dict`.
            - Uses the `xml.dom.minidom` parser to aprse the xml source file and rperesent it as a Tree.
            - *returns:*
                - `person_dict` dictionary.
## 1.3 Speech Parser (speechParser.py)
- This file contains 3 classes `Document`, `Speech` and `speechParser`.
- `Document` and `Speech` classes are used to store the information extracted by the `speechParser` file.
- ### 1.3.1 Document
    - `Document(flieName:str, country_code:str)`
    - A class for grouping the information about the file from which the speech transcript was extracted.
    - **Attributes:** 
        - `fileName` - name of the source file (`string`)
        - `country_code` - Code of the country (`string`)
- ### 1.3.2 Speech
    - `Speech(tokens:int, sentences:int, NE_refs:int role:str, speech_id:str, speaker:str, when:str)`
    - A class for grouping and storing the relevant information extracted from transcripts.
    - Contains information on number of tokens, sentences, named entitiy references in the transcripts as well as the date the speech was given, speaker and their position (chair, regular, guest)
    - **Attributes:**
        - `tokens` - number of tokens in the speech (`int`)
        - `sentences` - number of sentences in the speech (`int`)
        - `named_entity_references` - number of named entity references in the speech (`int`)
        - `role` - position of the speaker (`string`)
        - `speechID` - Id of the speech extracted from the xml source file (`string`).
        - `speakerID` - Id of the speaker who gave this speech (`string`).
        - `when` - Date the speech was given (`string`) YYYY-MM-DD.
    - **Methods:**
        - `__str__()`
            - Modified conversion of objects to strings for debugging purposes.
- ### 1.3.3 speechParser
    - `speechParser(source_dir:str)`
    - A class responsible for the extraction of metadata about the speeches.
    - **Attributes:**
        - `source_dir` - a directory where the entire corpus is stored (`string`).
        - `current_file` - a file currently being processed (`string`).
        - `corpus_root` - path to the corpus root file (`string`)
            - Defaultly ParCzech corpus root for debug purposes.
    - **Methods:**
        - **`__get_relevant_tags_count(speech)`**
            - Method for extracting the count of tokens, sentences, and named entity references for given utterance.
            - Iterates over the \<seg\> tags within the utterance and counts the number of \<s\> tag within it.
            - Then does the same for \<w> and \<name\> tag.
            - *parameters:*
                - `speech` - \<u\> element of the ParlaMint transcript .xml file.
            - *returns:*
                - count of the \<w> tags within the utterance.
                - count of the \<s> tags within the utterance.
                - count of the \<name> tags within the utterance.
        - **`process_file(filePath)`**
            - Uses `lxml.etree` parser to parse the .xml file and reperesent it as a Tree data structure.
            - A method for extracting the speech information from a singular file.
            - First looks at the root tag of the file, if it is `TEI` then considers the file to be a transcript file and proceeds to extract information from it.
            - Finds all instances of the \<u> tag and iterates over them, extracting the values of the utterances `who` and `ana` attributes to extract the author and their position.
            - After that forwards the singular utterance to the `__get_relevant_Tags_count()` method, which extracts the rest.
            - *parameters*:
                - `filePath` - Path to the file which is to be processed (`string`)
            - *returns*:
                - `result` a dictionary containing information about the speech as well as the author of the speech in the key-value pair `(speakerID:Speech)`
        - **`__dump_contents(contents)`**
            - Method for printing the extracted information to a file.
            - For debugging purposes.
            - *parameters:*
                - `contents` - extracted information about the speech. Dictionary containing th ekey-value pairs `(speakerID:Speech)`
        - **`parseSpeeches()`**
            - For debugging purposes.
            - Iterates over all transcript files, processes them and prints the extracted information to a file using the `__dump_contents()` method.
            - This functionality was later moved to the `main_driver.py`.