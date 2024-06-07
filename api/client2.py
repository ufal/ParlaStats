#!usr/bin/python3
import requests
import json
import os

import argparse

args_parser = argparse.ArgumentParser()
args_parser.add_argument("--query_source", type=str, default="example_queries/", help="Path to query jsons which are to be processed.")
args_parser.add_argument("--URL", type=str, default="http://127.0.0.1:5000/query", help="Where is the flask server running.")

class Client2():
    def __init__(self, args):
        self.URL = args.URL
        self.URL = "http://127.0.0.1:5000/query"
        self.QueryDir = args.query_source

    def __process_query(self, query_file):
        with open(query_file, 'r') as file:
            query = json.load(file)
        response = requests.post(self.URL, json=query)
        return response.json()
    
    def run(self):
        #TODO: Iterate over directory with json queries:
        # 1. Send json query to server
        # 2. Display table / graph of the json response received.
        for filename in os.listdir(self.QueryDir):
            if filename.endswith(".json"):
                query_file = os.path.join(self.QueryDir, filename)
                print(f"Processing {query_file} ...")
                result = self.__process_query(query_file)
                print(f"Result for {query_file}:")
                print(json.dumps(result, indent=2))
                print("\n")


if __name__ == "__main__":
    args = args_parser.parse_args()
    client = Client2(args)
    client.run()

    
