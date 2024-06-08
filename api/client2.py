#!usr/bin/python3
import requests
import json
import os

import argparse
from prettytable import PrettyTable
import matplotlib.pyplot as plt


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
        return query['graph'], query['description'], response.json()
    
    def __adjust_results(self, result):
        if result:
            table = PrettyTable()
            table.field_names = result[0].keys()
        
            for r in result:
                table.add_row(r.values())
            
            print(table)
        else:
            print("Nothing to print")

    def __graph_results(self, result):
        # TODO: finish
        if result:
            print(result)
        else:
            print("Nothing to graph.")

    def run(self):
        for filename in os.listdir(self.QueryDir):
            if filename.endswith(".json"):
                query_file = os.path.join(self.QueryDir, filename)
                print(f"Processing {query_file} ...")
                graph, description, result = self.__process_query(query_file)
                print(f"Result for {query_file}:")
                print(description)
                if graph == 'N':
                    self.__adjust_results(result)
                    #print(json.dumps(result, indent=2))
                    print("\n")
                else:
                    self.__graph_results(result)


if __name__ == "__main__":
    args = args_parser.parse_args()
    client = Client2(args)
    client.run()

    
