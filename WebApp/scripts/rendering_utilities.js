import { getArtificialColumns } from './artificialColumns.js'
import { getMetaInformation } from './metaInformation.js'
import { getTranslations } from './translations.js'


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
											  typeMapping) {
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
	userDefinedAliases.forEach(alias => {
		const selectOption = document.createElement('option');
		selectOption.className = "user-specific";
		selectOption.value = alias;
		selectOption.textContent = alias;
		targetElement.appendChild(selectOption);
	});
}

export function addTypeBasedAggOfferings(targetElement, aggFuncSelect, availableColumns, typeMappings, currentLanguage) {
	targetElement.addEventListener('change', function (event) {
		aggFuncSelect.value = "";
		const options = aggFuncSelect.querySelectorAll('option');
		options.forEach(option => option.remove());
		const selectedOption = event.target.selectedOptions[0].value;
		let selectedColumnMeta = "";
		Object.keys(artificialColumns).forEach(key => {
			if (artificialColumns[key].formula === selectedOption) {
				selectedColumnMeta = artificialColumns[key].type;
			}
		});
		if (selectedColumnMeta === "") {
			selectedColumnMeta = availableColumns.find(col => col.column == targetElement.value).type;
		}
		typeMappings[selectedColumnMeta].forEach(aggFunc => {
			const selectOption = document.createElement('option');
			selectOption.value = aggFunc;
			selectOption.textContent = translations[aggFunc][currentLanguage];
			aggFuncSelect.appendChild(selectOption)
		});
	});
}

export function addStepResultsOfferings(targetElement, stepResultArray, stepIndex, currentLanguage) {
	let index = 0;
	stepResultArray.forEach(step => {
		if (index < stepIndex) {
			step.forEach(column => {
				const selectOption = document.createElement('option');
				selectOption.className = "user-specific";
				selectOption.value = column;
				selectOption.textContent = column;
				targetElement.appendChild(selectOption);
			});
		}
	});
}
