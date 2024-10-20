import subprocess
import difflib
import argparse


args_parser = argparse.ArgumentParser()
args_parser.add_argument("--s",action="store_true", help="Set this flag to test speeches")

test_cases_speeches = [
    ("REAL","--file=examples/inputs/real.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedReal.txt"),
    ("MISSING TIMESTAMPS","--file=examples/inputs/missingTimestamps.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedMissingTimestamps.txt"),
    ("ENCAPSULATED WORDS","--file=examples/inputs/encapsulatedWords.xml", "--wd=../../MetadataExtraction", "examples/expected/expectedEncapsulatedWords.txt"),
    ("MULTIPLE SPEECHES", "--file=examples/inputs/multipleSpeeches.xml",  "--wd=../../MetadataExtraction", "examples/expected/expectedMultipleSpeeches.txt"),    
]


my_venv = "../../../bakalarka/bin/python3"
speech_parser = "../../MetadataExtraction/speechParser2.py"

def test_speeches():
    for test_name, test_file, test_wd, expected_output in test_cases_speeches:
        expected = ""
        process = subprocess.run([my_venv, speech_parser, test_file, test_wd], capture_output=True, text=True)
    
        actual_output = process.stdout.strip()
    
        with open(expected_output, 'r') as f:
            expected = f.read().strip()
    
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
        test_speeches()
        print("########## DONE #############")

if __name__ == "__main__":
    main(args_parser.parse_args())

