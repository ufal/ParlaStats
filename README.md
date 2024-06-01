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
	- For obvious reasons I am not including my `database.ini` file into this
	  repository
	- If any trouble arises with this file please let me know.
