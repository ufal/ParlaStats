let translations = {
	"availableLanguages":["en", "cs"],
	"speech.time_silent": {
		"en":"Time silent",
		"cs":"Čas ticha"
	},
	"speech.time_spoken": {
		"en":"Time spoken",
		"cs":"Čas mluvení"
	},
	"speech.date": {
		"en":"Date of the speech",
		"cs":"Datum promluvy"
	},
	"person.sex": {
		"en":"Speaker gender",
		"cs":"Pohlaví mluvčího"
	},
	"persname.surname": {
		"en":"Speaker surname",
		"cs":"Přijmení mluvčího"
	},
	"speech.time_end": {
		"en":"Speech end time",
		"cs":"Čas konce promluvy"
	},
	"person.person_id": {
		"en":"ID of the speaker",
		"cs":"ID mluvčího"
	},
	"speech.time_start": {
		"en":"Speech start time",
		"cs":"Čas začátku promluvy"
	},
	"persname.forename": {
		"en":"Speaker forename",
		"cs":"Křestní jméno mluvčího"
	},
	"speech.total_duration" : {
		"en":"Total duration of speech",
		"cs":"Délka promluvy"
	},
	"affiliation.until": {
		"en":"Speaker organization affiliation end",
		"cs":"Datum konce afiliace"
	},
	"affiliation.since":{
		"en":"Speaker organization affiliation start",
		"cs":"Datum začátku afiliace"
	},
	"speech.sentence_count":{
		"en":"Number of sentences",
		"cs":"Počet vět v promluvě"
	},
	"sppech.token_count":{
		"en":"Number of tokens",
		"cs":"Počet tokenů v promluvě"
	},
	"organisation.role":{
		"en":"Role of the organization",
		"cs":"Role organizace vrámci parlamentu"
	},
	"persname.addname":{
		"en":"Speaker addname",
		"cs":"Střední jméno mluvčího"
	},
	"speech.role":{
		"en":"Role of the speaker",
		"cs":"Role mluvčího vrámci parlamentu"
	},
	"organisation.name":{
		"en":"Organization name",
		"cs":"Název organizace"
	},
	"person.birth":{
		"en":"Speaker birth date",
		"cs":"Datum narození mluvčího"
	},
	"speech.named_entity_count":{
		"en":"Number of named entity references",
		"cs":"Počet referncií na pojemnované entity"
	},
	"speech.time_unknown":{
		"en":"Undistinguishible speech time",
		"cs":"Čas promluvy který nelze rozeznat"
	},
	"speech.earliest_timestamp":{
		"en":"Earliest timestamp of the speech",
		"cs":"Nejskorší časová značka promluvy"
	},
	"speech.latest_timestamp":{
		"en":"Latest timestamp of the speech",
		"cs":"Nejpozdejší časová značka promluvy"
	},
}

function storeTranslations() {
	localStorage.setItem("translations", JSON.stringify(translations));
}

export function getTranslations() {
	const translations = localStorage.getItem("translations");
	return translations ? JSON.parse(translations) : [];
}

document.addEventListener("DOMContentLoaded", storeTranslations);

