# ParlaStats
Parliamentary debates statistics presentation
# How to run
## 1. Creating the database
- First, we need to have PostgreSQL installed on our system as that is what I use to create the database.
- Second, we need to create the database itself, for that we can use the shell script in DatabaseCommunication.
 ```shell
 chmod +x DatabaseCommunication/create_database.sh
 ```
 - Run the script:
 ```shell
 ./DatabaseCommunication/create_database.sh parlastats
 ```
 - This creates the empty database, to which python script will later store the extracted data,
 and to which we sall submit our querries.
 - The script also grants all privilages to the user, who created the database using this script.
 ## 2. Filling up the database
 - All python scripts that work with the database assume that the corpus is stored in the following way:
	- Lets say we have a directory `MyDir` from which we cloned into ParlaStats
	- Then the project is stored like this: `MyDir/ParlaStats`
	- Corpus should be then stoed like: `MyDir/ParCzech.TEI.ana`
- To fill the database then navigate to the `ParlaStats` directory and run the `main_driver.py` in a following way:
```shell
python3 main_driver.py --create_tables
```
- This will result in extracting information from the corpus and may take a while (on my machine about 15 minutes).
## 3. Querying the database
- After that we can enter the querying mode by invoking:
```shell
python3 main_driver.py --query_mode 
```
- This will let the user to present PostgreSQL syntax friendly SQL querries to the database.
- or a text file with queries (each on separate line can be presented using the `--query_file` argument when calling `main_driver.py`
- **IMPORTANT NOTE**: python scripts use the `DatabaseCommunication/database.ini` file to connect to the database.
	- This file should contain these infromation in following format:
	```
	[postgresql]
	host=localhost
	database=parlastats
	user=<user as who you wish to access the database>
	password=<password associated with the user>
	```
	- For obvious reasons I am not including my `database.ini` file into t
	  repository
	- If any trouble arises with this file please let me know.
## 4. Querying using the api (OLD VERSION, SEE SECITON 5)
- Other way how to query the database is via api.
- This api tries to make querying easier for non-technical user.
- Custom queries are typed and so far only these are possible:
	- **Time framed queries**(`tf` in their type) - allow the user to specify a time window for speeches.
	- **Comparison queries**(`comp` in their type) - allow the user to compare multiple politicians or genders (so far)
### 4.1 How to run the api
- Navigate to the `ParlaStats/api` directory
- Then launch the flask server by invoking `python3 api.py`
- Once that is up and running, launch the client by invoking `python3 client.py`
- Now when bouth are successfuly running, continue to querying.
### 4.2 How to query 
- Upon launch and until terminated the client will ask you to specify desired query type
- So far the available query types are:
	- `genders` - single gender
	- `genders_tf` - single gender time framed
	- `comp_genders` - comparison based on genders
	- `comp_genders_tf` - time framed comparison based on genders
	- `specific_speaker` - specific politician
	- `specific_speaker_tf` - specific politician time framed
	- `comp_specific_speakers` - comparison of specific speakers, **>= 2**
	- `comp_specific_speakers_tf` - time framed comparison of specific speakers **>= 2**
- Upon entering one of these query types, the client will then ask you for all specifics it needs.
### 4.3 Results of the query
- Non-comparison querries return numerical value based on the query.
- Comparison queries return bar charts for compared items.

## 5. Querying using the new JSON dirven client-server api
- Navigate to `ParlaStats/api` directiory
- Then launch the flask server by invoking `python3 Server2.py`
- Once that is up and running, launch the client by invoking `python3 client2.py`
- The new `client2` uses `json` files to describe the information need, which is then converted to appropriate `SQL` query by the `Server2`
- For now, the `client2` takes queries from `api/example_queries` directory.
- This directory always contains the information need in form of sentence in natural language as well as its `json` representation
	- I will add more complex soon (done?)
- The `api` directory also contains `json_query_Structure.md` file which describes the structure of the `json` queries which `Server2` currently assumes.
- There are two options what to do with the results so far.
	- First one is that they can be printed in terminal in form of tables for that `--dir` commandline argument should not be used
	- Second one is that they can be stored as text files containing both the json format result and the table for visualization. If this is desired set the `--dir` when running `client2.py` to desired directory
	- Example text file outputs can be found in `api/example_queries/example_results/` directory
