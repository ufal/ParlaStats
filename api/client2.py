#!usr/bin/python3
import requests
import json
import os
import time

import argparse
from prettytable import PrettyTable
import matplotlib.pyplot as plt


args_parser = argparse.ArgumentParser()
args_parser.add_argument("--query_source", type=str, default="example_queries/queries", help="Path to query jsons which are to be processed.")
args_parser.add_argument("--URL", type=str, default="http://127.0.0.1:5000/query", help="Where is the flask server running.")
args_parser.add_argument("--dir", type=str, default=None, help="Directory to write output to:")
args_parser.add_argument("--specific_query", type=str, default=None,help="Help specific query to execute")
args_parser.add_argument("--interactive", action="store_true", help="Set this flag to enable interactive mode while querying")


class Client2():
    def __init__(self, args):
        self.URL = args.URL
        self.URL = "http://quest.ms.mff.cuni.cz/parlastats/api/query"
        self.QueryDir = args.query_source
        self.target_dir = args.dir
        self.interactive = args.interactive
    
    def __process_query(self, query_file):
        start_time = time.time()*1000
        with open(query_file, 'r') as file:
            query = json.load(file)
        response = requests.post(self.URL, json=query)
        end_time = time.time()*1000
        return query['description'], response.json(), (end_time - start_time)
    
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
            plt.grid(True)
            plt.xlabel(label_x)
            plt.ylabel(label_y)
            plt.xticks(rotation=45, ha='right')
            plt.title(description)
            plt.tight_layout()
            plt.show()
        else:
            print("Nothing to graph.")
    
    def run_specific(self, specific_query):
        # print(f"Processing {specific_query} ...")
        description, result, runtime = self.__process_query(specific_query)
        # print(f"Result for {specific_query}:")

        res=None
        if self.interactive:
            graph = input("Would you like to graph the results?(Y/n)")
            if graph == 'Y':
                for res in result[1:]:
                    self.__graph_results(description, res)
            else:
                for res in result[1:]:
                    res = self.__adjust_results(res)
                    print(f"Running time: {runtime} ms")
                    print()
                    print(res)
        else:
            for res in result[1:]:
                res = self.__adjust_results(res)
                print(f"Running time {runtime} ms")
                print()
                print(res)
                
        if self.target_dir:
            with open(f"{self.target_dir}/{specific_query[:-5]}_result.txt", 'w') as file:
                print(result, file=file)
                print(file=file)
                print(f"Running time {runtime} ms", file=file)
                print(file=file)
                print(self.__adjust_results(result), file=file)
                print(file=file)
                print()

    def run(self):
        for filename in os.listdir(self.QueryDir):
            
            if filename.endswith(".json"):
                query_file = os.path.join(self.QueryDir, filename)
                print(f"Processing {query_file} ...")
                description, results, runtime = self.__process_query(query_file)
                for result in results:
                    
                    if self.interactive:
                        graph = input("Would you like to graph the results?(Y/n)")
                        if graph == 'Y':
                            self.__graph_results(description, result)
                        else:
                            
                            print(f"Result for {query_file}:")
                            print(self.__adjust_results(result))
                    
                    else:
                        print(result)
                        print(f"Result for {query_file}:")
                        print(self.__adjust_results(result))
                    if self.target_dir:
                        with open(f"{self.target_dir}{filename[:-5]}_result.txt", 'w') as file:
                            print(result, file=file)
                            print(file=file)
                            print(f"Running time {runtime} ms", file=file)
                            print(file=file)
                            res = self.__adjust_results(result)
                            print(str(res), file=file)
               
if __name__ == "__main__":
    args = args_parser.parse_args()
    client = Client2(args)
    if args.specific_query:
        client.run_specific(args.specific_query)
    else:
        client.run()

    
