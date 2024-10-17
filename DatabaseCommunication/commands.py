#!usr/bin/python3

from enum import StrEnum

class PersonCommands(StrEnum):
    INSERT_ALL = """INSERT INTO Person(person_id, sex, birth) VALUES(%s, %s, %s) ON CONFLICT (person_id) DO NOTHING"""
    INSERT_NAME_RECORD = """INSERT INTO persName(since, until, surname, forename, addname, person_id) VALUES(%s, %s, %s, %s, %s, %s)"""
    INSERT_AFFILIATION_RECORD = """ INSERT INTO affiliation(since, until, role, person_id, organisation_id) VALUES(%s, %s, %s, %s, %s)"""

class OrganisationCommands(StrEnum):
    INSERT_ALL = """INSERT INTO organisation(organisation_id, role, name)
                    VALUES(%s, %s, %s) ON CONFLICT (organisation_id) DO NOTHING"""

class SpeechCommands(StrEnum):
    INSERT_ALL = """
                 INSERT INTO speech(id, date, token_count, sentence_count, named_entity_count, role, person_id, total_duration, earliest_timestamp, latest_timestamp, unaligned_tokens, time_spoken, time_silent, time_unknown)
                 VALUES(%s,%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING
                 """
