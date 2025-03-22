#!../../bakalarka/bin/python3

import psycopg2
from DatabaseCommunication.DatabaseOperator import DatabaseOperator

class MIDatabaseFiller(DatabaseOperator):
    def __init__(self):
        super().__init__("DatabaseCommunication/parczech4_0.ini")
        config_main = self._DatabaseOperator__load_configuration("DatabaseCommunication/postgres.ini")
        config_meta = self._DatabaseOperator__load_configuration("DatabaseCommunication/meta.ini")
        print(config_main)
        self.connection_main = self._DatabaseOperator__establish_connection(config_main)
        self.connection_meta = self._DatabaseOperator__establish_connection(config_meta)
    
    def __fetch_databases(self):
        with self.connection_main.cursor() as main_cursor:
            main_cursor.execute("""SELECT datname FROM pg_database WHERE datistemplate = false AND datname != %s;""",("meta",))
            return [row[0] for row in main_cursor.fetchall()]

    def __fetch_tables(self, database_name):
        database_config = self._DatabaseOperator__load_configuration(f"DatabaseCommunication/{database_name}.ini")
        with psycopg2.connect(**database_config) as database_connection:
            with database_connection.cursor() as database_cursor:
                database_cursor.execute("SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema');")
                return  database_cursor.fetchall()

    def __fetch_columns(self, database_name, schema, table):
        database_config = self._DatabaseOperator__load_configuration(f"DatabaseCommunication/{database_name}.ini")
        with psycopg2.connect(**database_config) as database_connection:
            with database_connection.cursor() as database_cursor:
                database_cursor.execute("""
                    SELECT column_name, data_type FROM information_schema.columns
                    WHERE table_schema = %s AND table_name = %s
                    AND column_name NOT IN (
                        SELECT a.attname
                        FROM pg_constraint con
                        JOIN pg_class cls ON cls.oid = con.conrelid
                        JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
                        JOIN pg_attribute a ON a.attrelid = cls.oid AND a.attnum = ANY(con.conkey)
                        WHERE con.contype = 'f'
                            AND cls.relname = %s
                            AND nsp.nspname = %s
                    );
                """, (schema, table, table, schema))
                return database_cursor.fetchall()
    
    def update_metadata(self):
        with self.connection_meta.cursor() as meta_cursor:
            databases = self.__fetch_databases()
            for database in databases:
                meta_cursor.execute("INSERT INTO databases (database_name) VALUES (%s) ON CONFLICT (database_name) DO NOTHING RETURNING id;", (database,))
                database_id = meta_cursor.fetchone()
                if database_id: database_id = database_id[0]

                for schema, table in self.__fetch_tables(database):
                    meta_cursor.execute("INSERT INTO tables (database_id, schema_name, table_name) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING RETURNING id;", (database_id, schema, table))
                    table_id = meta_cursor.fetchone()
                    if table_id: table_id = table_id[0]
                    
                    print(self.__fetch_columns(database, schema, table))
                    for column_name, data_type in self.__fetch_columns(database, schema, table):
                        meta_cursor.execute("INSERT INTO columns (table_id, column_name, data_type) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING;", (table_id, column_name, data_type))
            self.connection_meta.commit()


