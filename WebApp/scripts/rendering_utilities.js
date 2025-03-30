import { getArtificialColumns } from './artificialColumns.js'
import { getMetaInformation } from './metaInformation.js'
import { getTranslations, translateStepResults } from './translations.js'

let artificialColumns = getArtificialColumns();
let metaInformation = getMetaInformation();
let translations = getTranslations();

export function addDatabaseColumnOfferings(offerings, targetElement, currentLanguage) {
	offerings.forEach(item => {
		const selectOption = document.createElement('option');
		selectOption.value = item.column;
		if (translations[item.column]) {
			selectOption.textContent = translations[item.column][currentLanguage];
			targetElement.appendChild(selectOption);
		}
	});
}

export function addArtificialColumnOfferings( targetElement, currentLanguage) {
	Object.keys(artificialColumns).forEach(item => {
		const selectOption = document.createElement('option');
		selectOption.value = artificialColumns[item].formula;
		selectOption.textContent = translations[item][currentLanguage];
		targetElement.appendChild(selectOption);
	});
}



export function makeAggregationFunctionSelect(availableColumns, targetElement, currentLanguage, forField,
											  typeMapping, userDefinedAliases, stepResultArray) {
	let aggFOptions = ['AVG', 'SUM', 'MAX', 'MIN', 'COUNT', 'DISTINCT', ""];
	let currentField = forField;
	if (currentField) {
		if (typeof currentField === "object") {
			currentField = currentField.real;
		}
		let currentFieldMeta = "";
		Object.keys(artificialColumns).forEach(key => {
			if (artificialColumns[key].formula === currentField) {
				currentFieldMeta = artificialColumns[key].type;
			}
		});
		userDefinedAliases.forEach(item => {
			console.log(userDefinedAliases);
			console.log(currentField);
			if (currentField === item.alias) {
				Object.keys(artificialColumns).forEach(key => {
					if (item.real === artificialColumns[key].formula) {
						currentFieldMeta = artificialColumns[key].type;
					}
				});
				if (currentFieldMeta === "") {
					currentFieldMeta = availableColumns.find(col => col.column === item.real).type;
				}
			}
		});
		if (currentField.includes("step_result")) {
			console.log(stepResultArray);
			stepResultArray.forEach(step => {
				step.forEach(item => {
					if (currentField === item.queryPart) {
						currentFieldMeta = item.type;
					}
				});
			});
		}
		if (currentFieldMeta === "") {
			currentFieldMeta = availableColumns.find(col => col.column === currentField).type;
		}
		if (currentFieldMeta !== "") {
			aggFOptions = typeMapping[currentFieldMeta];
		}
	}
	aggFOptions.forEach(option => {
		const aggFOption = document.createElement('option');
		aggFOption.value = option;
		aggFOption.textContent = translations[option][currentLanguage];
		targetElement.appendChild(aggFOption);
	});
	targetElement.value = "";
}

export function addUserDefinedAliases(targetElement, userDefinedAliases) {
	userDefinedAliases.forEach(aliasEntry => {
		const selectOption = document.createElement('option');
		selectOption.className = "user-specific";
		selectOption.value = aliasEntry.alias;
		selectOption.textContent = aliasEntry.alias;
		targetElement.appendChild(selectOption);
	});
}


export function addStepResultsOfferings(targetElement, stepResultArray, stepIndex, currentLanguage) {
	let index = 0;
	stepResultArray.forEach(step => {
		if (index < stepIndex) {
			step.forEach(column => {
				const selectOption = document.createElement('option');
				selectOption.className = "user-specific";
				selectOption.value = column.queryPart;
				selectOption.textContent = translateStepResults(column.queryPart, translations, artificialColumns,
				                                                currentLanguage);
				targetElement.appendChild(selectOption);
			});
		}
	});
}

export function updateAllAggregationSelects(userDefinedAliases, stepResultsArray, aggregationTypeMapping, currentLanguage) {
	const columnSelects = document.querySelectorAll('.column-select');
	columnSelects.forEach(colSelect => {
		const rowContainer = colSelect.closest('.repeatable-row');
		if (!rowContainer) { return; }

		let stepIndex = rowContainer.getAttribute('data-step-index');
		stepIndex = stepIndex !== null ? parseInt(stepIndex, 10) : null;
		const aggSelect = rowContainer.querySelector('.agg-select');

		if (!aggSelect) { return; }
		const currentAggValue = aggSelect.value;
		
		aggSelect.innerHTML = "";

		const selectValue = colSelect.value;
		let columnType = getColumnType(stepIndex, userDefinedAliases, stepResultsArray, selectValue);
		let aggOptions = aggregationTypeMapping[columnType] || [""];
		aggOptions.forEach(option => {
			const selectOption = document.createElement('option');
			selectOption.value = option;
			selectOption.textContent = translations[option] ? translations[option][currentLanguage] : option;
			aggSelect.appendChild(selectOption);
		});

		if (aggOptions.includes(currentAggValue)) {
			aggSelect.value = currentAggValue;
		} else { aggSelect.value = ""; } 

	});

}

function getColumnType(stepIndex, userDefinedAliases, stepResultsArray, selectValue) {
	let columnType = null;
	Object.keys(artificialColumns).forEach(key => {
		if (artificialColumns[key].formula === selectValue) {
			columnType = artificialColumns[key].type;
		}
	});
	if (!columnType && stepIndex !== null && userDefinedAliases[stepIndex]) {
		userDefinedAliases[stepIndex].forEach(aliasEntry => {
			if (aliasEntry.alias === selectValue) {
				const realValue = aliasEntry.real;
				Object.keys(artificialColumns).forEach(key => {
					if (artificialColumns[key].formula === realValue) {
						columnType = artificialColumns[key].type;
					}
				});
				if (!columnType) {
					const colEntry = metaInformation.columns.find(col => col.column === realValue);
					if (colEntry) {
						columnType = colEntry.type;
					}
				}
			}
		});
	}
	if (!columnType) {
		const colEntry = metaInformation.columns.find(col => col.column === selectValue);
		if (colEntry) {
			columnType = colEntry.type;
		}
	}
	if (!columnType) {
		const colEntry = metaInformation.columns.find(col => col.column === selectValue);
		for (let i = 0; i < stepIndex; i++) {
			if (stepResultsArray[i]) {
				stepResultsArray[i].forEach(result => {
					if (result.queryPart === selectValue);
					columnType = result.type;
				});
			}
		}
	}
	if (!columnType) {
		columnType = "NoAggregation";
	}
	return columnType;
}

function getPossibleValues(stepIndex, userDefinedAliases, stepResultsArray, database, selectValue) {
	let possibleValues = [];
	let metaColumn = selectValue;
	console.log(selectValue);
	let found = false;
	if (stepIndex !== null && userDefinedAliases[stepIndex]) {
		userDefinedAliases[stepIndex].forEach(aliasEntry => {
			if (aliasEntry.alias === selectValue) {
				metaColumn = alias.real;
				found = true;
			}
		});
	}

	
	if (!found) {
		for (let i = 0; i < stepIndex; i++) {
			if (stepResultsArray[i]) {
				stepResultsArray[i].forEach(result => {
					if (result.queryPart === selectValue) {
						let parts = result.queryPart.split('/');
						metaColumn = parts[2];
					}
				});
			}
		}
	}
	
	const columnEntry = metaInformation.columns.find(col => col.column === metaColumn);
	if (columnEntry) {
		console.log(columnEntry);
		possibleValues = columnEntry["data"][database];		
	} 
	
	return possibleValues;

	
	
}

export function UpdateConditionValuePossibilities(userDefinedAliases, stepResultsArray, databases) {
	const columnSelects = document.querySelectorAll('.column-select-conditions');
	columnSelects.forEach(colSelect => {
		const rowContainer = colSelect.closest('.repeatable-row');
		if (!rowContainer) { return; }
		
		let stepIndex = rowContainer.getAttribute('data-step-index');
		stepIndex = stepIndex !== null ? parseInt(stepIndex, 10) : null;
		const valueInput = rowContainer.querySelector('.condition-value-input');
		
		if (!valueInput) { return; }
		const currentValue = valueInput.value;
		valueInput.innerHTML = "";
		
		let columnSelectType = getColumnType(stepIndex, userDefinedAliases, stepResultsArray, colSelect.value);
		
		let possibleValues = []
		
		if (databases) {
			databases.forEach(database => {
				let databasePossibleValues = getPossibleValues(stepIndex, userDefinedAliases, 
															stepResultsArray, database, colSelect.value);
				
				if (columnSelectType === "character varying"){
					databasePossibleValues.forEach(value => {
						if (!possibleValues.includes(value)) {
							possibleValues.push(value);
						}
					});
				} else {
					databasePossibleValues.forEach(value => {
						if (!possibleValues.includes(value)) {
							possibleValues.push(value);
						}
					});
				}
				
			});
		}
		
		const fuse = new Fuse(possibleValues, {
			threshold:0.4,
			includeScore:true,
		});
		const suggestionList = rowContainer.querySelector('.suggestionList');
		
		valueInput.addEventListener("input", () => {
			const query = valueInput.value.trim();
			suggestionList.innerHTML = "";
			if (query === "") { return; }
			
			let results = [];
			if (columnSelectType === "character varying") {
				results = fuse.search(query, {limit:5});
			} else {
				results = possibleValues;
			}
			results.forEach(result => {
				const item = document.createElement("li");
				if (columnSelectType === "character varying") {
					item.textContent = result.item;
				} else {
					item.textContent = result;
				}
				suggestionList.appendChild(item);
			});
		});	
		
	});
}

