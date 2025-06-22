import { getTranslations, translateStepResults } from './translations.js' 
// import { getArtificialColumns } from './artificialColumns.js'
import { metaInformationPromise } from './metaInformation.js'

let translations = getTranslations();
// const artificialColumns = getArtificialColumns();
const metaInformation = await metaInformationPromise;

export function storeAliases(jsonQuery, aliases, stepResultsArray, stepIndex) {
	aliases[stepIndex] = [];
	const targetStep = jsonQuery.steps[stepIndex];
	const columns = targetStep.columns;
	columns.forEach(column => {
		if (typeof column === 'object') {
			console.log(column);
			if (column.alias && !aliases[stepIndex].includes(column.alias)) {
				
				let real = metaInformation.columns.find(col => col.column === column.real);
				console.log("ALIAS", columns.alias);
				if (!real) {
					for (let i = 0; i < stepIndex; i++) {
						if (stepResultsArray[i]) {
							stepResultsArray[i].forEach(result => {
								if (result.queryPart === column.real) {
									real = result;
								}
							});
						}
					}
				}
				// if (!real) {
				// 	Object.keys(artificialColumns).forEach(key => {
				// 		if (artificialColumns[key].formula === column.real) {
				// 			real = artificialColumns[key];
				// 		}
				// 	});
				// }
				let data = (real.data) ? real.data : [];
				let aliasesEntry = {
					"real":column.real,
					"alias":column.alias,
					"agg_func":column.agg_func,
					"type":real.type,
					"possibleValues":data
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
		let possibleValues = [];
		let stepResult = {
			"queryPart":"",
			"type":"",
			"possibleValues":[]
		};
		if (typeof column === 'object') {
			// check artificial columns
			// Object.keys(artificialColumns).forEach(entry => {
			// 	if (artificialColumns[entry].formula === column.real) {
			// 		columnType = entry.type;
			// 	}
			// });
			
			// check metaInformation
			metaInformation.columns.forEach(entry => {
				if (entry.column === column.real) {
					columnType = entry.type;
					possibleValues = entry.data;
				}
			});

			if (columnType === "") {
				const entry = aliases[stepIndex].find(col => col.alias === column.alias);
				if (entry) {
					columnType = entry.type;
					possibleValues = entry.possibleValues;
				}
			}
			
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
			// Object.keys(artificialColumns).forEach(entry => {
			// 	if (entry.formula === column.real) {
			// 		columnType = entry.type;
			// 	}
			// });
			
			// check metaInformation
			metaInformation.columns.forEach(entry => {
				if (entry.column === column) {
					columnType = entry.type;
					possibleValues = entry.data;
				}
			});

			queryPart = "step_result/" + stepName + "/" + column;
		}
		stepResult.queryPart = queryPart;
		stepResult.type = columnType;
		stepResult.possibleValues = possibleValues;
		stepResultsArray[stepIndex].push(stepResult);
	});
}

export function updateColumnsOfferings(userDefinedAliases, stepResultsArray, stepIndex) {
	for (let index = stepIndex; index < stepResultsArray.length; index++) {
		let columnOffering = document.querySelectorAll(`.column-select-${index}`);
		columnOffering.forEach(columnSelect => {
			const selectedOption = columnSelect.value;
			const options = columnSelect.querySelectorAll('option.user-specific');
			options.forEach(op => op.remove());

			let aliases = userDefinedAliases[index];
			aliases.forEach(aliasEntry => {
				const selectOption = document.createElement('option');
				selectOption.className = "user-specific";
				selectOption.value = aliasEntry.alias;
				selectOption.textContent = aliasEntry.alias;
				columnSelect.appendChild(selectOption);
			});
			let currentLanguage = document.getElementById('languageSelection').value;
			for (let i = 0; i < index; i++) {
				stepResultsArray[i].forEach(res => {
					const selectOption = document.createElement('option');
					selectOption.className = "user-specific";
					selectOption.value = res.queryPart;
					selectOption.textContent = translateStepResults(res.queryPart, translations, currentLanguage);
					columnSelect.appendChild(selectOption);
				});
			}
			columnSelect.value = selectedOption;
			M.FormSelect.init(columnSelect);
		});
	}
}

export function updateColumnsOfferings2(userDefinedAliases, stepResultsArray, stepsCount) {
	for (var index = 0; index <= stepsCount; index++) {
		let columnOfferings = document.querySelectorAll(`.column-select-${index}`);
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
			// console.log(index);
			for (var i = 0; i < index; i++) {
				stepResultsArray[i].forEach(stepResult => {
					const selectOption = document.createElement('option');
					selectOption.className = "user-specific";
					selectOption.value = stepResult.queryPart;
					selectOption.textContent = translateStepResults(stepResult.queryPart, translations, currentLanguage);
					columnSelect.appendChild(selectOption);
					// console.log(selectOption.value);
				});
			}
			columnSelect.value = selectedOption;
			M.FormSelect.init(columnSelect);
		});
		
	}
}


