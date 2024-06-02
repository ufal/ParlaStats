#!usr/bin/python3

import requests
import json
from PIL import Image
from io import BytesIO

URL = 'http://127.0.0.1:5000/api/custom_query'

def send_custom_query(query_type, parameters):
    payload = {'query_type': query_type,
               'parameters': parameters}

    headers = {'Content-Type': 'application/json'}
    response = requests.post(URL, data=json.dumps(payload), headers=headers)

    if response.status_code == 200:
        if 'image/png' in response.headers.get('Content-Type'):
            img = Image.open(BytesIO(response.content))
            img.show()
        else:
            print("Response: ", response.json())
    else:
        print("Failed to retrieve data: ", response.status_code, response.text)


def main():
    client_running = True
    while client_running:
        query_type = input("Please enter the query type you wish to present:\n")
        if query_type == 'non_comparison_genders':

            desired_gender = input("Please enter the desired gender (F-female, M-male, U-unknown):\n")
            what = input("Please enter the desired operation (SUM, AVG, COUNT, etc.):\n")
            target_data = input("Please enter the data you would like to apply the operation on (token_count, sentence_count, named_entity_count):\n")
            send_custom_query(query_type, {'gender': desired_gender,
                                           'what': what,
                                           'target_data': target_data})
        
        if query_type == 'comparison_genders':
            what_to_compare = input("Please select what would you like to compare (SUM, AVG, etc.):\n")
            column = input("Please select which information to target(token_count, sentence_count, named_entity_count):\n")
            send_custom_query(query_type, {'what':what_to_compare,
                                           'column':column})

        if query_type == 'non_comparison_genders_tf':
            what = input("Please enter the desired operation (SUM, AVG, COUNT, etc.):\n")
            target_data = input("Please enter the data you would like to apply the operation on (token_count, sentence_count, named_entity_count):\n")
            desired_gender = input("Please enter the desired gender (F-female, M-male, U-unknown):\n")
            since = input("Please enter the lower boud of time frame you are interested in in the format YYYY-MM-DD:\n")
            to = input("Please enter the upper bound of time frame you are interested in in the fomrat YYYY-MM-DD:\n")
            send_custom_query(query_type, {'what':what,
                                           'gender':desired_gender,
                                           'target_data':target_data,
                                           'since':since,
                                           'to':to})
if __name__ == "__main__":
    main()
