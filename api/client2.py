#!usr/bin/python3
import requests
import json
import os

import argparse
from prettytable import PrettyTable
import matplotlib.pyplot as plt


args_parser = argparse.ArgumentParser()
args_parser.add_argument("--query_source", type=str, default="example_queries/CS/queries", help="Path to query jsons which are to be processed.")
args_parser.add_argument("--URL", type=str, default="http://127.0.0.1:5000/query", help="Where is the flask server running.")
args_parser.add_argument("--dir", type=str, default=None, help="Directory to write output to:")
args_parser.add_argument("--specific_query", type=str, default=None,help="Help specific query to execute")
args_parser.add_argument("--interactive", action="store_true", help="Set this flag to enable interactive mode while querying")


class Client2():
    def __init__(self, args):
        self.URL = args.URL
        self.URL = "http://127.0.0.1:5000/query"
        self.QueryDir = args.query_source
        self.target_dir = args.dir
        self.interactive = args.interactive
    
    def __process_query(self, query_file):
        with open(query_file, 'r') as file:
            query = json.load(file)
        response = requests.post(self.URL, json=query)
        return query['description'], response.json()
    
    def __adjust_results(self, result):
        if result:
            table = PrettyTable()
            table.field_names = result[0].keys()
        
            for r in result:
                table.add_row(r.values())
            
            return table     
        else:
            print("Nothing to print")

    def __graph_results(self, description, result):
        # TODO: finish
        labels = []
        values = []
        label_x = list(result[0].keys())[0]
        label_y = list(result[0].keys())[-1]
        if result:
            for sub in result:
                #keys = list(sub.keys())
                labels.append(sub[label_x])
                values.append(sub[label_y])
            
            plt.figure(figsize=(8,6))
            plt.bar(labels, values)
            plt.xlabel(label_x)
            plt.ylabel(label_y)
            plt.title(description)
            plt.show()
        else:
            print("Nothing to graph.")
    
    def run_specific(self, specific_query):
        print(f"Processing {specific_query} ...")
        description, result = self.__process_query(specific_query)
        print(f"Result for {specific_query}:")
        print(description)
        res = self.__adjust_results(result)
        print(res)
        

    def run(self):
        for filename in os.listdir(self.QueryDir):
            if filename.endswith(".json"):
                query_file = os.path.join(self.QueryDir, filename)
                print(f"Processing {query_file} ...")
                description, result = self.__process_query(query_file)
                
                if self.interactive:
                    graph = input("Would you like to graph the results?(Y/n)")
                    if graph == 'Y':
                        self.__graph_results(description, result)
                    else:
                        print(f"Result for {query_file}:")
                        print(self.__adjust_results(result))
                else:
                    print(f"Result for {query_file}:")
                    
                    print(self.__adjust_results(result))
                if self.target_dir:
                    with open(f"{self.target_dir}{filename[:-5]}_result.txt", 'w') as file:
                        print(result, file=file)
                        print(file=file)
                        res = self.__adjust_results(result)
                        print(str(res), file=file)
                #else:
                #    res = self.__adjust_results(result)
                #    print(res)
                #    print("\n")
                #else:
                #    self.__graph_results(result)


if __name__ == "__main__":
    args = args_parser.parse_args()
    client = Client2(args)
    if args.specific_query:
        client.run_specific(args.specific_query)
    else:
        client.run()

    
