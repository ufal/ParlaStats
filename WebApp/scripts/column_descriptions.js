let descriptions = {
	"organisation.organisation_id": {
		"en":"Unique identifier for organizations"
	},
	"speech.id": {
		"en":"Unique identifier for speeches"
	},
	"affiliation.role": {
		"en":"A role that speaker held in the organization during this affiliation. \n Can have various values based on type of the organization. Minister, representative, member etc."
	},
	"speech.time_silent": {
		"en":"A total amount of time when the speaker was silent during their speech in miliseconds(e.g. thinking, pause between words, etc.). Only available for ParCzech corpus."
	},
	"speech.time_spoken": {
		"en":"A total amount of time when the speaker was speaking during their speech in miliseconds. Only available for ParCzech corpus."
	},
	"speech.date": {
		"en":"Date when the speech was given in the format YYYY-MM-DD"
	},
	"person.sex": {
		"en":"Sex of the person, M is for male, F for female, there may be some people for who this information is missing(U as unknown)."	
	},
	"speech.term": {
		"en":"Election term in which the speech was given."
	},
	"speech.artif_wpm": {
		"en":"Speaking pace of the speech measured as words per minute. Only available for ParCzech corpus."
	},
	"speech.artif_dow": {
		"en":"Day of the week when the speech was given. Monday(0) - Sunday(6)"		
	},
	"speech.artif_month": {
		"en":"Month when the speech was given. January(1) - December(12)"
	},
	"speech.artif_year": {
		"en":"Year when the speech was given."
	},
	"persname.surname": {
		"en":"Surname of a person, for a single person, there may be multiple (i.e. marriage)"
	},
	"speech.time_end": {
		"en":"End time of the speech in format HH:MM:SS. Only available for ParCzech.",
	},
	"person.person_id": {
		"en":"Unique identifier of a person. Unlike forename or surename, there is guaranteed to be exactly one per person."
	},
	"speech.time_start": {
		"en":"Start time of the speech in format HH:MM:SS. Only available for ParCzech corpus."
	},
	"persname.forename": {
		"en":"The forename of a person."
	},
	"speech.total_duration": {
		"en":"Total duration of a speech in miliseconds, regardless of silent pauses. Only available for ParCzech."
	},
	"affiliation.until": {
		"en":"Date of the end of speaker-organization affiliation in the format of YYYY-MM-DD"
	},
	"affiliation.since": {
		"en":"Date of the beginning of speaker-organization affiliation in format of YYYY-MM-DD"
	},
	"speech.sentence_count": {
		"en":"Number of sentences in a speech."
	},
	"speech.token_count": {
		"en":"Number of tokens (essentialy words) in a speech."
	},
	"organisation.role": {
		"en":"Role or the type of the organization like: parliamentary group, political party, institution, etc."
	},
	"persname.addname": {
		"en":"Middle name of a person."
	},
	"speech.role": {
		"en":"Type of speaker who gave the speech (regular, chair, quest)."
	},
	"organisation.name": {
		"en":"Name of the organization in native language."
	},
	"person.birth": {
		"en":"Birth date of a person in the format of YYYY-MM-DD. For some people, this information may be missing."
	},
	"speech.named_entity_count": {
		"en":"Number of named entity references within a speech."
	},
	"speech.time_unknown": {
		"en":"The amount of time in miliseconds, where the audio processing tool failed to determine whether speaker spoke or was silent. Only available for ParCzech."
	},
	"speech.earliest_timestamp": {
		"en":"Absolute time of the earliest <timeline> of the speech in format of HH:MM:SS. Only available for ParCzech."
	},
	"speech.latest_timestamp": {
		"en":"Absolute time of the earliest <timeline> of the speech in format of HH:MM:SS. Only available for ParCzech."
	}
}

export function getDescriptions() {
	return descriptions;
}
