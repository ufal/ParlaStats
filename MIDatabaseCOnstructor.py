#!usr/bin/python3

from DatabaseCommunication.MIDatabaseTableCreator import MIDatabaseTableCreator
from DatabaseCommunication.MIDatabaseFiller import MIDatabaseFiller

def main():
    tableCreator = MIDatabaseTableCreator("DatabaseCommunication/meta.ini")
    tableFiller = MIDatabaseFiller()
    tableCreator.create_tables()
    tableFiller.update_metadata()

if __name__ == "__main__":
    main()
