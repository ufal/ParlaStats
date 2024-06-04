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
        if query_type == 'genders':

            desired_gender = input("Please enter the desired gender (F-female, M-male, U-unknown):\n")
            what = input("Please enter the desired operation (SUM, AVG, COUNT, etc.):\n")
            target_data = input("Please enter the data you would like to apply the operation on (token_count, sentence_count, named_entity_count):\n")
            send_custom_query(query_type, {'gender': desired_gender,
                                           'what': what,
                                           'target_data': target_data})
        
        if query_type == 'comp_genders':
            what_to_compare = input("Please select what would you like to compare (SUM, AVG, etc.):\n")
            column = input("Please select which information to target(token_count, sentence_count, named_entity_count):\n")
            send_custom_query(query_type, {'what':what_to_compare,
                                           'column':column})

        if query_type == 'genders_tf':
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
        
        if query_type == 'comp_genders_tf':
            what = input("Please enter the desired operation (SUM, AVG, COUNT, etc.):\n")
            target_data = input("Please enter the data you would like to apply the operation on (token_count, sentence_count, named_entity_count):\n")
            since = input("Please enter the lower bound of time frame you are interested in in the format YYYY-MM-DD:\n")
            to = input("Please enter the upper bound of time frame you are intersted in in the format YYYY-MM-DD:\n")
            send_custom_query(query_type, {'what':what,
                                           'target_data':target_data,
                                           'since':since,
                                           'to':to})

        if query_type == 'specific_speaker':
            what = input("Please enter the desired operation (SUM, AVG, COUNT, etc.):\n")
            target_data = input("Please enter the data you would like to apply the operation to (token_count, sentence_count, named_entity_count):\n")
            name = input("Please enter the name of the speaker you are interested in:\n")
            send_custom_query(query_type, {'what':what,
                                           'target_data':target_data,
                                           'name':name})
        
        if query_type == 'specific_speaker_tf':
            what = input("Please enter the desired operation (SUM, AVG, COUNT, etc.):\n")
            target_data = input("Please enter the data you would like to apply the operation on (token_count, sentence_count, named_entity_count):\n")
            name = input("Please enter the name of the speaker you are interested in:\n")
            since = input("Please enter the lower bound of time frame you are intersted in in the format YYYY-MM-DD:\n")
            to = input("Please enter the upper bound of time frame you are interseted in in the format YYYY-MM-DD:\n")
            send_custom_query(query_type, {'what':what,
                                           'target_data':target_data,
                                           'name':name,
                                           'since':since,
                                           'to':to})

        if query_type == "comp_specific_speakers":
            what = input("Please enter the desired operation (SUM, AVG, COUNT, etc.):\n")
            target_data = input("Please enter the data you would like to apply the operation on (token_count, sentence_count, named_entity_count):\n")
            names = input("Please enter the names of politicians you are interested in separated by ,:\n")
            send_custom_query(query_type, {'what':what,
                                           'target_data':target_data,
                                           'names':names})

        if query_type == "comp_specific_speakers_tf":
            what = input("Please enter the desired operation (SUM, AVG, COUNT, etc.):\n")
            target_data = input("Please enter the data you would like to apply the operation in (token_count, sentence_count, named_entity_count):\n")
            names = input("Please enter the names of politicians you are interseted in separated by,:\n")
            since = input("Please enter the lower bound of time frame you are interested in in the format YYYY-MM-DD:\n")
            to = input("Please enter the upper bound of time frae you are interested in in the format YYYY-MM-DD:\n")
            send_custom_query(query_type, {'what':what,
                                           'target_data':target_data,
                                           'names':names,
                                           'since':since,
                                           'to':to})
        if query_type == 'rank_speakers':
            criterion = input("Please enter the ranking criterion:\n")
            number = input("Please enter the number of politicians to display:\n")
            ordering = input("Please select the ordering (top/bottom):\n")
            gender = input("Please enter the gender you are interseted in(F-female, M-male, U-unknown), if none enter N:\n")
            if ordering.lower() == 'top':
                ordering = 'DESC'
            else:
                ordering = 'ASC'
            
            if gender == 'N':
                send_custom_query(query_type, {'criterion':criterion,
                                               'number':number,
                                               'ordering':ordering})
            else:
                send_custom_query(query_type, {'criterion':criterion,
                                               'number':number,
                                               'ordering':ordering,
                                               'gender':gender})
if __name__ == "__main__":
    main()
