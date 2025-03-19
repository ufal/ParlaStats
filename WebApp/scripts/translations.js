let UItranslations = {
	"inputJsonTitle": {
		"en":"Input JSON query",
		"cs":"Vstupní JSON dotaz"
	},
	"loadQueryButton": {
		"en":"Load Query",
		"cs":"Načíst dotaz"
	},
	"languageSelectionLabel": {
		"en":"Language selection",
		"cs":"Výběr Jazyku"
	},
	"targetDatabaseSectionTitle": {
		"en":"Target database and Query Description",
		"cs":"Cílové databáze a popis dotazu",
	},
	"targetDatabaseTitle": {
		"en":"Target Databases",
		"cs":"Cílové databáze"
	},
	"targetDatabaseAddButton": {
		"en":"Add target database",
		"cs":"Přidat cílovou databázi"
	},
	"DescriptionLabel": {
		"en":"Description",
		"cs":"Popis"
	},
	"DescriptionInputPlaceHolder": {
		"en":"Query Description",
		"cs":"Popis dotazu"
	},
	"StepsTitle": {
		"en":"Steps",
		"cs":"Kroky"
	},
	"AddStepButtonText": {
		"en":"Add Step",
		"cs":"Přidat krok"
	},
	"StepNameInputLabel": {
		"en":"Step name",
		"cs":"Jméno kroku"
	},
	"StepNameInputPlaceholder": {
		"en":"Name",
		"cs":"Jméno"
	},
	"columnsHeader": {
		"en":"Columns",
		"cs":"Sloupce"
	},
	"addColumnButtonText": {
		"en":"Add column",
		"cs":"Přidat sloupec"
	},
	"AggregationSectionTitle": {
		"en":"Aggregation",
		"cs":"Agregační sekce"
	},
	"GroupBySectionTitle": {
		"en":"Group By",
		"cs":"Zoskupit podle"
	},
	"AddGroupByButtonText": {
		"en":"Add Group By",
		"cs":"Přidat sloupec pro zoskupení"
	},
	"OrderBySectionTitle": {
		"en":"Order By",
		"cs":"Seřadit podle"
	},
	"OrderByAscendingDirection": {
		"en":"Ascending",
		"cs":"Vzestupně"
	},
	"OrderByDescendingDirection": {
		"en":"Descending",
		"cs":"Zestupně"
	},
	"AddOrderByButtonText": {
		"en":"Add order by",
		"cs":"Přidat sloupec pro seřazení"
	},
	"FilteringSectionTitle": {
		"en":"Filtering",
		"cs":"Filtrační část"
	},
	"ConditionsSectionTitle": {
		"en":"Conditions",
		"cs":"Podmínky"
	},
	"AddConditionButtonText": {
		"en":"Add condition",
		"cs":"Přidat podmínku"
	},
	"OutputJSONTitle": {
		"en":"Query JSON",
		"cs":"JSON dotaz"
	},
	"QueryJSONPlaceholder": {
		"en":"Resulting JSON query",
		"cs":"Výseldný JSON dotaz"
	},
	"GenerateQueryButtonText":{
		"en":"Generate Query",
		"cs":"Vygenerovat dotaz"
	},
	"SendQueryButtonText": {
		"en":"Send Query",
		"cs":"Poslat dotaz"
	},
	"inputJSONPlaceholder": {
		"en":"Paste JSON query here",
		"cs":"Zde vložte JSON dotaz"
	},
	"outputJSONPlaceholder": {
		"en":"Resulting JSON query",
		"cs":"Výsledný JSON dotaz"
	}
}

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
	"speech.token_count":{
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

function storeUITranslations() {
	localStorage.setItem("UItranslations", JSON.stringify(UItranslations));
}

function storeTranslations() {
	localStorage.setItem("translations", JSON.stringify(translations));
}

export function getTranslations() {
	const translations = localStorage.getItem("translations");
	return translations ? JSON.parse(translations) : [];
}

export function getUITranslations() {
	const UItranslations = localStorage.getItem("UItranslations");
	return UItranslations ? JSON.parse(UItranslations) : [];
}

document.addEventListener("DOMContentLoaded", storeTranslations);
document.addEventListener("DOMContentLoaded", storeUITranslations);

