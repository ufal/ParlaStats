# Parlastats - user documentation

## Contents
- Introduction
- How to use
- Aims of the project and further extension vision.

## 1. Introduction
- Parlastats is (so far) a console application allowing users to work with the <a href="https://www.clarin.eu/parlamint">Parlamit</a> and <a href="">ParCzech</a> corpora.
- The application extracts various data from the corpora upon which then querying is possible via the porvided api.
- The extracted data contains:
    - Metadata about individual speakers (their name records, speeches given)
    - Metadata about speeches (token count, sentence count, named entity references count, date of the speech)
    - Metadata about organisations (Names of parties / groups)
    - Metadata about affiliations (Role of the person within the organisation, duration of the affiliation)
- This data is then stored locally on a PostgreSQL database.
- The goal of this project is to provide a simpler way of browsing / fetching and aggregating the information contained in the corpora, namely for some statistical pruposes.
## 2. How to use
### 2.1 Creating the database(s)
- Upon succesful cloning, first, a <a href="">PostgreSQL</a> database needs to be created on localy on the machine.
- For that, navigate to `DatabaseConnection/` and run the shell script `create_database.sh`.
- This script takes the name of the database as input.
    ```shell
    ./create_database.sh <database_name>
    ```
- The name of the created database can be whatever you want, but you will need to specify it later in the **database.ini** files
- **database.ini**:
    - These files should be located in the `DatabaseCommunication` directory, otherwise you will need to specify the path to these files when calling inidvidual scripts of the project.
    - Their purpose is to serve as a connection configuration files, so python scripts know which database to connect and how.
    - Naming convention for these is `database{country_code}.ini` where `country_code` is obtained from the corpus, i.e. if you have the latvian corpus ParlaMint-LV, then the `country_code` should be `LV`.
    - The contents of the `.ini` files should look like <a href="https://github.com/ufal/ParlaStats/blob/main/DatabaseCommunication/template_database.ini">this</a>.
### 2.2 Filling the database(s)
- Upon successful creation of the databases, next step is to create the tables and fill them with data.
- To do that, navigate to the cloned directory and invoke the following:
    ```shell 
    python3 main_driver.py --create_tables
    ```
- The `main_driver.py` script also takes other non-mandatory arguments, listed below:
    - `--root` - name of the corpus root. 
        - **default**: `ParCzech.ana.xml`
    - `--root_dir` - directory where the corpus root should be located. 
        - **default**: `../ParCzech.TEI.ana/`
        - Let's say you have a driectory `MyDir`, from which you cloned inot the Parlastas repo.
        - Then the `main driver` assumes, that the corpus si stored as `MyDir/ParCzech.TEI.ana`
        - If the situation is different, you need to specify the path to corpus directory using this command line argument.
    - `--database` - path to the database connection configuration file. 
        - **default**: `DatabaseCommunication/databaseCS.ini`
- This process may take a while, on my machine the ParCzech corpus is loaded in about 10 minutes.
### 2.3 Querying the database(s)
- Upon succesful loading of the corpora to the databases, you can now proceed to query them.
- The interface for querying runs on the `client-server` principle, where clinet and server communicate with each other via jsons.
- First, you'll need to start the server by invoking:
    ```bash
    python3 Server2_1.py
    ```
- Then you run the client by invoking:
    ```bash
    python3 client2.py
    ```
- **Client**
    - Takes the json query file, processes it, sends the request to the server and then prints the foramtted response from the server.
    - All queries should be stored in their own json files, which are then forwarded to the client.
    - Example queries are available <a href="https://github.com/ufal/ParlaStats/tree/main/api/example_queries">here</a> along with the results, they produce.
    - There is also the description of tje json file structure, should you want to create your own queries.
    - **Arguments**
        - `--query_source` - path to directory with json query files, which should be processed.
        - `--URL` - connection the server, by default `http://127.0.0.1:5000/query`
        - `--dir` - target directory to store the results.
        - `--specific_query` - Should you want to run just one query, you can specify the path to its json file with here
        - `--interactive` - Enables the **interactive mode**.
    - **Interactive mode**
        - By default, the client only iterates over the directory with json queries, and prints the formated result.
        - In the interactive mode, for each query, you'll get to decide whether you would like to construct a bar chart of the results, or just print it the usual way.

## 3. Future 
- The application, as it is now, is a console application with all servers running locally, all data stored locally.
- Further improvements, among other, could target this particular aspect.
- To be precise, the final goal is to create an application, which would allow users to conduct some statistical research upon the ParlaMint and ParCzech corpora, ideally in the form of web application.
- The big advantage of the ParaLint corpora is, that it has strictly defined format, and the corpra are available for many european languages allowing even cross-language statistic research and analysis.
- The goal of the first part of the project (current state) was to design and implement a backend for such web application.
- Additionaly, ParCzech corpus contains audio recordings of the speeches as well, which could bring many more interesting statistical insights, and which are not extracted by the application yet.
- **So all-in-all improvement I would like to do:**
    - Design and implement convenient GUI for better and more enjoyable user experience.
    - Create a frontend of the web application and link it to the backend.
    - Run the server scripts on some actual server, not locally.
    - Provide more means of visualization of the retrieved data (graphs / charts other than bar chart)
    - Include the processing of audio as well, where it is present and possible.