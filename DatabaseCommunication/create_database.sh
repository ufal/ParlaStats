#!/bin/bash

DB_NAME=$1

USER_NAME=$(whoami)

createdb $DB_NAME

psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $USER_NAME;"

echo "Database $DB_NAME created succesfully and all privileges granted to user $USER_NAME"

