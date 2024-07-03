# Parlastats - User Documentation

## Contents
- Introduction
- How to use

## 1. Introduction
- ParlaStats is a console application allowing users to interact with the <a href="https://www.clarin.eu/parlamint">ParlaMint</a> and <a href="https://lindat.mff.cuni.cz/repository/xmlui/handle/11234/1-5360">ParCzech</a> corpora.
- **ParlaMint** corpora contain transcripts of parliamentary debates of 29 European countries and autonomous regions covering at least the period from 2015 to 2022 and contain over 1 billion words. The corpora are uniformly encoded, contain rich metadata bout their 24 thousand speakers and are linguistically annotated up to the level of Universal Dependencies syntax and Named Entities.
- **ParCzech** is then an extension based on the ParlaMint format containing only czech transcripts. One of the extensions is for example the addition of audio files which are aligned with the text in annotated TEI files.
- The application extracts various data from the corpora which can be then queried using the provided API.
- The extracted data contains:
    - Metadata about individual speakers (their names, speeches)
    - Metadata about speeches (token count, sentence count, named entity references count, date)
    - Metadata about organisations (names of parties / groups)
    - Metadata about affiliations (role of the person within the organisation, the duration of his/her affiliation)
- This data is then stored in a Local PostgreSQL database.
## 2. How to use
### 2.1 Creating the database(s)
- Upon successful cloning, the first step is to create a <a href="">PostgreSQL</a> database locally on your machine.
- To do so, navigate to `DatabaseConnection/` and run the shell script `create_database.sh`.
- This script requires the name of the database as input.
    ```shell
    ./create_database.sh <database_name>
    ```
- This needs to be done for each corpus you wish to use the application for.
- The name of the created database can be chosen freely, but you will need to specify later in the **database.ini** files:
    - These files should be located in the `DatabaseCommunication` directory, otherwise you will need to specify the path to these files when calling inidvidual scripts of the project.
    - Their purpose is to serve as a connection configuration files, so Python scripts know which database to connect and how.
    - Their naming convention for these is `database{country_code}.ini` where `country_code` is obtained from the corpus, i.e. if you have the Latvian corpus ParlaMint-LV, then the `country_code` should be `LV`.
    - The contents of the `.ini` files should look like <a href="https://github.com/ufal/ParlaStats/blob/main/DatabaseCommunication/template_database.ini">this</a>.
### 2.2 Filling the database(s)
- Before filling the databases, you will need to have all the corpora you wish to use downloaded locally on your machine.
- Once the databases have been succesfully created, next step is to create the tables and fill them with data.
- To do so, navigate to the cloned directory and invoke the following:
    ```shell 
    python3 main_driver.py --create_tables
    ```
- The `main_driver.py` script also accpets other optional arguments:
    - `--root` - name of the corpus root. 
        - **default**: `../ParCzech.TEI.ana/ParCzech.ana.xml`
        - Let's say you have a driectory `MyDir`, from which you cloned into the ParlaStas repo.
        - Then the `main_driver` assumes, that the corpus si stored as `MyDir/ParCzech.TEI.ana`
        - If the situation is different, you need to specify the path to corpus root file using this command line argument.
    - `--database` - path to the database connection configuration file. 
        - **default**: `DatabaseCommunication/databaseCS.ini`
- This process may take a while, on my machine the ParCzech corpus is loaded in about 10 minutes.
- My machine specs:
    - **CPU:** Intel Core i5-10300H Comet Lake 64bit
    - **GPU:** NVIDIA GeForce RTX 3050 Ti Mobile
    - **RAM :** 16GB DDR4
### 2.3 Querying the database(s)
- Once the corpora have been successfullyloaded into the databases, you can now proceed to query them.
- The querying interface runs on the `client-server` principle, where the client and server communicate with each other via JSON.
- To begin, you'll need to start the server by invoking:
    ```bash
    python3 Server2_1.py
    ```
- Then you run the client by invoking:
    ```bash
    python3 client2.py
    ```
- **Client**
    - Takes the JSON query file, processes it, sends the request to the server and then prints the formatted response from the server.
    - Each query should be stored in its own JSON file, which is then sent to the client.
    - Example queries for processing and their results are available <a href="https://github.com/ufal/ParlaStats/tree/main/api/example_queries">here</a> .
    - There is also a description of the JSON file structure, if you wish to create your own queries.
    - **Arguments**
        - `--query_source` - path to the directory with JSON query files, which need to be processed.
        - `--URL` - connection to the server, by default `http://127.0.0.1:5000/query`
        - `--dir` - target directory to store the results.
        - `--specific_query` - If you want to run a single query, you can specify the path to its JSON file here.
        - `--interactive` - Enables the **interactive mode**.
    - **Interactive mode**
        - By default, the client iterates over the directory with JSON queries and prints the formatted result.
        - In the interactive mode, for each query, you can choose whether to construct a bar chart of the results or just print them in the usual way.
