import subprocess
import time
import difflib
import argparse
import os
import re

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--source_dir", type=str, default="examples/inputs/",
                         help="Directory where to look for test queries.")
args_parser.add_argument("--target_dir", type=str, default="examples/actual/", 
                         help="Directory where to store the results of queries.")
args_parser.add_argument("--specific", type=str, default=None, help="Specific query path.")
args_parser.add_argument("--expected", type=str, default=None, help="Path to the expected result file.")

my_venv = "../../../bakalarka/bin/python3"
server = "../../api/Server2_1.py"
client = "../../api/client2.py"

def main(args):
    server_process = subprocess.Popen([my_venv, server, "--db=../../DatabaseCommunication/"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(2)
    try:
        if (args.specific):
            try:
                assert args.expected is not None
            except AssertionError:
                print("Missing the expected output.")
                return 
            print("---TESTING SPECIFIC QUERY---")
            client_process = subprocess.run([my_venv, client, f"--specific_query={args.specific}"], capture_output=True, text=True)
            actual = client_process.stdout.strip()
            f1 = open(args.expected, 'r')
        
            expected = f1.read().strip()
            
            expected = [line for line in expected.splitlines() if not "Running time" in line]
            actual = [line for line in actual.splitlines() if not "Running time" in line]
            correct = True
            
            for el, al in zip(expected, actual):
                if el != al:
                    correct = False
            
            if (correct):
                print(f"Query {args.specific}: PASSED!")
            else:
                diff = difflib.unified_diff(expected, actual,
                                            fromfile='expected', tofile='actual', lineterm='')
                print(f"Query {args.specific}: FAILED!")
                print("------------------------------")
                for line in diff:
                    print(line)
                print("------------------------------")
        else:
            print("---TESTING ALL QUERIES AT ONCE---")
            
            client_process = subprocess.run([my_venv, client, f"--query_source={args.source_dir}",
                                         f"--dir={args.target_dir}"], capture_output=True, text=True)
            
            results = os.listdir(args.target_dir)
            targets = os.listdir("examples/expected/")
            for result, target in zip(results, targets):
                f1 = open(f"examples/actual/{result}", 'r')
                f2 = open(f"examples/expected/{target}", 'r')
                actual = f1.read().strip()
                expected = f2.read().strip()
                f1.close()
                f2.close()

                expected = [line for line in expected.splitlines() if not "Running time" in line]
                actual = [line for line in actual.splitlines() if not "Running time" in line]
                correct = True
                for el, al in zip(expected, actual):
                    if el != al:
                        correct = False   
                
                if (correct):
                    print(f"Query: {result[:]} PASSED!")
                else:

                    diff = difflib.unified_diff(expected, actual,
                                                fromfile='expected', tofile='actual', lineterm='')
                    print(f"Query: {result} FAILED!")
                    print("-----------------------")
                    for line in diff:
                        print(line)
                    print("-----------------------")
                    

    finally:
        server_process.terminate()
        server_process.wait()


if __name__ == "__main__":
    main(args_parser.parse_args())
