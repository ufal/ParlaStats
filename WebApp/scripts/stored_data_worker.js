import { getTranslations, translateStepResults } from './translations.js' 
import { getArtificialColumns } from './artificialColumns.js'
import { getMetaInformation } from './metaInformation.js'

let translations = getTranslations();
let artificialColumns = getArtificialColumns();
let metaInformation = getMetaInformation();

export function storeAliases(jsonQuery, aliases, stepIndex) {
	aliases[stepIndex] = [];
	const targetStep = jsonQuery.steps[stepIndex];
	const columns = targetStep.columns;
	columns.forEach(column => {
		if (typeof column === 'object') {
			if (column.alias && !aliases[stepIndex].includes(column.alias)) {
				let aliasesEntry = {
					"real":column.real,
					"alias":column.alias,
					"agg_func":column.agg_func
				}
				aliases[stepIndex].push(aliasesEntry);
			}
		}
	});
}

export function storeStepResults(jsonQuery, stepResultsArray, aliases, stepIndex) {
	stepResultsArray[stepIndex] = [];
	const targetStep = jsonQuery.steps[stepIndex];
	const stepName = targetStep.goal;
	const columns = targetStep.columns;
	
	columns.forEach(column => {
		let columnType = "";
		let queryPart = "";
		let stepResult = {
			"queryPart":"",
			"type":""
		};
		if (typeof column === 'object') {
			// check artificial columns
			Object.keys(artificialColumns).forEach(entry => {
				if (entry.formula === column.real) {
					columnType = entry.type;
				}
			});
			
			
			// check metaInformation
			metaInformation.columns.forEach(entry => {
				if (entry.column === column.real) {
					columnType = entry.type;
				}
			});
			
			// Else
			if (columnType === "") {
				columnType = "NoAggregation";
			}
			if (column.alias) {
				queryPart = "step_result/" + stepName + "/" + column.alias;
			} else {
				queryPart = "step_result/" + stepName + "/" + column.real;
			}
		} else if (typeof column === 'string') {
			// check artificial columns
			Object.keys(artificialColumns).forEach(entry => {
				if (entry.formula === column.real) {
					columnType = entry.type;
				}
			});
			
			// check metaInformation
			metaInformation.columns.forEach(entry => {
				if (entry.column === column) {
					columnType = entry.type;
				}
			});

			queryPart = "step_result/" + stepName + "/" + column;
		}
		stepResult.queryPart = queryPart;
		stepResult.type = columnType;
		stepResultsArray[stepIndex].push(stepResult);
	});
}

export function updateColumnsOfferings2(userDefinedAliases, stepResultsArray, stepsCount) {
	for (var index = 0; index < stepsCount; index++) {
		let columnOfferings = document.querySelectorAll(`.column-select`);
		columnOfferings.forEach(columnSelect => {
			const selectedOption = columnSelect.value;
			const options = columnSelect.querySelectorAll('option.user-specific');
			options.forEach(option => option.remove());

			let aliases = userDefinedAliases[index];
			aliases.forEach(aliasEntry => {
				const selectOption = document.createElement('option');
				selectOption.className = "user-specific";
				
				selectOption.value = aliasEntry.alias;
				selectOption.textContent = aliasEntry.alias;
				columnSelect.appendChild(selectOption);
			});
			let languageSelectField = document.getElementById('languageSelection');
			let currentLanguage = languageSelectField.value;
			for (var i = 0; i < index; i++) {
				stepResultsArray[i].forEach(stepResult => {
					 const selectOption = document.createElement('option');
					selectOption.className = "user-specific";
					selectOption.value = stepResult;
					selectOption.textContent = translateStepResults(stepResult, translations, artificialColumns,
					                                                currentLanguage);
					columnSelect.appendChild(selectOption);
				});
			}
			columnSelect.value = selectedOption;
		});
		
	}
}


