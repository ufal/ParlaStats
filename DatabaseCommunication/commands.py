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
                 INSERT INTO speech(id, date, token_count, sentence_count, named_entity_count, role, person_id, term, total_duration, earliest_timestamp, latest_timestamp, unaligned_tokens, time_spoken, time_silent, time_unknown, time_start, time_end)
                 VALUES(%s,%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING
                 """
    INSERT_ARTIFICIAL_COLUMNS = """
                                ALTER TABLE speech 
                                    ADD COLUMN artif_year  smallint      GENERATED ALWAYS AS (extract(year FROM date))  STORED,
                                    ADD COLUMN artif_month smallint      GENERATED ALWAYS AS (extract(month FROM date)) STORED,
                                    ADD COLUMN artif_dow   smallint      GENERATED ALWAYS AS (extract(dow FROM date))   STORED,
                                    ADD COLUMN artif_wpm   NUMERIC(10,2) GENERATED ALWAYS AS (token_count::numeric * 60000 / NULLIF(total_duration,0)) STORED;
                                """

    INSERT_ORGANIZATION = """
                          INSERT INTO speech_affiliation (speech_id, affiliation_id)
                          SELECT s.id, a.aff_id
                          FROM speech AS s
                          JOIN affiliation AS a
                            ON a.person_id = s.person_id
                            AND s.date >= a.since
                            AND (a.until IS NULL OR s.date <= a.until)
                          ON CONFLICT DO NOTHING;
                          CREATE INDEX idx_sa_speech ON speech_affiliation (speech_id);
                          CREATE INDEX idx_sa_affil ON speech_affiliation (affiliation_id);
                          """

