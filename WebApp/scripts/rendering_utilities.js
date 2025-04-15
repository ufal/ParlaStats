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
		index++;
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
					columnType = aliasEntry.type;
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
		for (let i = 0; i < stepIndex; i++) {
			if (stepResultsArray[i]) {
				stepResultsArray[i].forEach(result => {
					if (result.queryPart === selectValue) {
						columnType = result.type;
					}
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
	let found = false;
	if (stepIndex !== null && userDefinedAliases[stepIndex]) {
		userDefinedAliases[stepIndex].forEach(aliasEntry => {
			if (aliasEntry.alias === selectValue) {
				possibleValues = aliasEntry.possibleValues[database];
				found = true;
			}
		});
	}

	
	if (!found) {
		for (let i = 0; i < stepIndex; i++) {
			if (stepResultsArray[i]) {
				stepResultsArray[i].forEach(result => {
					if (result.queryPart === selectValue) {
						possibleValues = result.possibleValues[database];
						found = true;
					}
				});
			}
		}
	}
	// Check artificialColumns
	if (!found) {
		Object.keys(artificialColumns).forEach(key => {
			if (artificialColumns[key].formula === selectValue) {
				console.log(selectValue);
				const columnEntry = metaInformation.columns.find(col => col.column === `artificial_columns.${key}`);
				possibleValues = columnEntry["data"][database];
				found = true;
			}
		});
	}
	if (!found) {
		const columnEntry = metaInformation.columns.find(col => col.column === selectValue);
		console.log(database, columnEntry, selectValue);
		if (columnEntry) {
			possibleValues = columnEntry["data"][database];		
		} 
	}
	return possibleValues;

	
	
}

function makeStringSuggestions(rowContainer, targetElement, possibleValues) {
	const fuse = new Fuse(possibleValues, {
		threshold:0.4,
		includeScore:true
	});
	const suggestionList = rowContainer.querySelector('.suggestionList');
	suggestionList.style.display="block";
	targetElement.addEventListener("input", () => {
		const query = targetElement.value.trim();
		suggestionList.innerHTML = "";
		if (query === "") { return; }

		let results = fuse.search(query, {limit:5});
		results.forEach(result => {
			const item = document.createElement("li");
			item.textContent = result.item;
			suggestionList.appendChild(item);
		});

	});
}

function makeNumericalSuggestions(rowContainer, targetElement, possibleValues) {
	const suggestionList = rowContainer.querySelector('.suggestionList');
	targetElement.addEventListener("input", () => {
		const query = targetElement.value.trim();
		suggestionList.innerHTML = "";
		if (query === "") { return; }
		const maxItem = document.createElement('li');
		maxItem.textContent = "Maximum: " + possibleValues[1];
		const minItem = document.createElement('li');
		minItem.textContent = "Minimum: " + possibleValues[0];
		suggestionList.appendChild(minItem);
		suggestionList.appendChild(maxItem);
	});
}

function makeDateSuggestions(rowContainer, targetElement, possibleValues) {
	const minDate = possibleValues[0];
	const maxDate = possibleValues[1];
	flatpickr(targetElement, {
		minDate,
		maxDate,
		dateFormat:"Y-m-d"
	});
	return flatpickr;
}

export function UpdateValueColumnOfferings(targetElement, userDefinedAliases, stepResultsArray, stepIndex, currentLanguage) {
	let compatibleColumns = [];
	const rowContainer = targetElement.closest('.repeatable-row');
	const columnSelect = rowContainer.querySelector('.column-select-conditions');
	const selectValueType = getColumnType(stepIndex, userDefinedAliases, stepResultsArray, columnSelect.value);
	targetElement.innerHTML = "";
	// Include aliases
	userDefinedAliases[stepIndex].forEach(aliasEntry => {
		if (selectValueType === aliasEntry.type) {
			compatibleColumns.push(aliasEntry.alias);
		}
	});
	
	// Artificial columns
	Object.keys(artificialColumns).forEach(key => {
		if (artificialColumns[key].type === selectValueType) {
			compatibleColumns.push(key);
			}
	});

	// Step results
	for (let i = 0; i < stepIndex; i++) {
		stepResultsArray[i].forEach(result => {
			if (result.type === selectValueType) {
				compatibleColumns.push(result.queryPart);
			}
		});
	}

	// Database tables
	metaInformation.columns.forEach(col => {
		if (col.type === selectValueType) {
			compatibleColumns.push(col.column);
		}
	});
	compatibleColumns.forEach(col => {
		const option = document.createElement('option');
		option.value = col;
		if (translations[col]){
			option.textContent = translations[col][currentLanguage];
			targetElement.appendChild(option);
		}
	});
}



export function UpdateConditionValuePossibilities(userDefinedAliases, stepResultsArray, databases) {
	const columnSelects = document.querySelectorAll('.column-select-conditions');
	columnSelects.forEach(colSelect => {
		const rowContainer = colSelect.closest('.repeatable-row');
		if (!rowContainer) { return; }
		let stepIndex = rowContainer.getAttribute('data-step-index');
		stepIndex = stepIndex !== null ? parseInt(stepIndex, 10) : null;
		const valueInput = rowContainer.querySelector('.autocomplete');

		let columnSelectType = getColumnType(stepIndex, userDefinedAliases, stepResultsArray, colSelect.value);

		let possibleValues = {};

		if (databases) {
			databases.forEach(database => {
				let databasePossibleValues = getPossibleValues(stepIndex, userDefinedAliases,
				                                               stepResultsArray, database, colSelect.value);
				console.log(databasePossibleValues);
				databasePossibleValues.forEach(value => {
					if (!Object.keys(possibleValues).includes(value)) {
						possibleValues[value] = null;
					}
				});
			});
		}
		
		const existingInstance = M.Autocomplete.getInstance(valueInput);
		if (existingInstance) { console.log("Yes")}
		
		setTimeout(() => {
			M.Autocomplete.init(valueInput, {
				data: possibleValues,
				limit: 5,
				minLength: ["text", "character varying"].includes(columnSelectType) ? 1 : 0,
				onAutocomplete: function(val) {
					console.log(`User selected: ${val}`)
				}
			});
		}, 100);
		 	
	});
	
}

