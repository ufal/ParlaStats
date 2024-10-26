import subprocess
import difflib
import argparse


args_parser = argparse.ArgumentParser()
args_parser.add_argument("--s",action="store_true", help="Set this flag to test speeches")
args_parser.add_argument("--p",action="store_true", help="Set this flag to test persons")

test_cases_speeches = [
    ("SIMPLE TIMESTAMPS", "--file=examples/inputs/timestampsSimple.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedTimestampsSimple.txt"),    
    ("MULTIPLE TIMELINES", "--file=examples/inputs/timestampsMultipleTimelines.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedTimestampsMultipleTimelines.txt"),
    ("NAMES AND DATES", "--file=examples/inputs/timestampsNamesAndDates.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedTimestampsNamesAndDates.txt"),
    ("MISSING ANCHORS", "--file=examples/inputs/timestampsMissngAnchors.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedTimestampsMissngAnchors.txt"),
    ("MULTIPLE SPEECHES", "--file=examples/inputs/timestampsMultipleSpeeches.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedTimestampsMultipleSpeeces.txt"),
    ("MESSY SPEECH", "--file=examples/inputs/timestampsValidInvalid.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedTimestampsValidInvalid.txt"),
    ("MESSY SPEECH MULTIPLE TIMELINES", "--file=examples/inputs/timestampsMultipleTimelinesInvalid.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedTimestampsMultipleTimelinesInvalid.txt"),
    ("CORRECT ORDER WRONG INTERVALS", "--file=examples/inputs/timestampsLastWord.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedTimestampsLastWord.txt"),
    ]

test_cases_persons = [
    ("NO ISSUES", "--file=examples/inputs/noIssuesPerson.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedNoIssuesPersons.txt"),
    ("MISSING AFFILIATIONS", "--file=examples/inputs/missingAffiliations.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedMissingAffiliations.txt"),
    ("MISSING BIRTH", "--file=examples/inputs/missingBirth.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedMissingBirth.txt")    
]

my_venv = "../../../bakalarka/bin/python3"
speech_parser = "../../MetadataExtraction/speechParser2.py"
person_parser = "../../MetadataExtraction/personParser2.py"
def test(what, test_cases):
    for test_name, test_file, test_wd, expected_output in test_cases:
        expected = ""
        process = subprocess.run([my_venv, what, test_file, test_wd], capture_output=True, text=True)
    
        actual_output = process.stdout.strip()
        error = process.stderr.strip()
        print(error)
        with open(expected_output, 'r') as f:
            expected = f.read().strip()
        
        with open(f"examples/actual/actual{expected_output[26:]}", 'w') as f:
            f.write(actual_output)

        if (actual_output == expected):
            print(f"Test {test_name}: PASSED!")
        else:
            diff = difflib.unified_diff(expected.splitlines(), actual_output.splitlines(),
                                    fromfile='expected',tofile='actual',lineterm='')
            
            print(f"Test {test_name}: FAILED!")
            print(f"-------------------------")
            for line in diff:
                print(line)
            print(f"-------------------------")

def main(args):
    if args.s:
        print("####TESTING SPEECH PARSER####")
        test(speech_parser, test_cases_speeches)
        print("########## DONE #############")
    if args.p:
        print("####TESTING PERSON PARSER####")
        test(person_parser, test_cases_persons)
        print("########## DONE #############")
if __name__ == "__main__":
    main(args_parser.parse_args())

