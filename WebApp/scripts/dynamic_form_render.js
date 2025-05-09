import { getMetaInformation } from './metaInformation.js'; 
import { storeAliases, storeStepResults, updateColumnsOfferings2, updateColumnsOfferings } from './stored_data_worker.js' 
import { getTranslations, getUITranslations, translateStepResults } from './translations.js'
import { getArtificialColumns } from './artificialColumns.js'
import * as Utilities from './rendering_utilities.js'
import { visualizeAsTable } from './visualization_scrpits/visualize_as_tables.js'
import { visualizeAsGraph, bindButtons } from './visualization_scrpits/graph_visualization.js'
import { createPreviewUpdateEvent } from './customEvents.js'
// ================ SOME GLOBAL DATA DECLARATION ====================

// json holding the query itself
let queryObject = {
	target_databases: [],
	description: "",
	steps:[]
};

// what types can use what aggregation functions
let aggregationFunctionTypeMapping = {
	"real":["SUM", "AVG", "MIN", "MAX", "COUNT", ""],
	"date":["MIN", "MAX", "COUNT","DISTINCT", ""],
	"character varying":["COUNT", "DISTINCT", ""],
	"time without time zone":["MIN", "MAX", "COUNT", "DISTINCT", ""],
	"integer":["SUM", "AVG", "MIN", "MAX", "COUNT", ""],
	"NoAggregation":[""]
}


// array of user defined aliases
let userDefinedAliases = []

// array of columns for selection for each step
let stepResultArray = []
// server connection specialization
let serverURL = "https://quest.ms.mff.cuni.cz/parlastats/api/query";
let testServerURL = "http://127.0.0.1:5000/query";

// json where metainformation about available databases is to be stored
let metaInformation = {};

let translations = getTranslations();
let currentLanguage = "en";
let UItranslations = getUITranslations();
let artificialColumns = getArtificialColumns();
// ==================================================================

function updatePreview() {
	const QueryPreview = document.getElementById('inputJSON');
	QueryPreview.textContent = JSON.stringify(queryObject, null, 2);
	autoResizeTextarea(QueryPreview);
}

function renderForm() {
	const container = document.getElementById('formContainer');
	container.innerHTML = '';
	const form = document.createElement('form');
	form.id = 'dynamicForm';
	
	const languageSelectDiv = document.createElement('div');
	const languageSelectLabel = document.createElement('label');
	languageSelectLabel.textContent = UItranslations.languageSelectionLabel[currentLanguage];
	const languageSelect = document.createElement('select');
	languageSelect.id = 'languageSelection';
	translations.availableLanguages.forEach(lang => {
		const selectOption = document.createElement('option');
		selectOption.value = lang;
		selectOption.textContent = lang;
		languageSelect.appendChild(selectOption);
	});
	languageSelect.value = currentLanguage;
	languageSelect.addEventListener('change', () => {
		currentLanguage = languageSelect.value;
		renderForm();
	});

	languageSelectDiv.appendChild(languageSelectLabel);
	languageSelectDiv.appendChild(languageSelect);

	const targetSection = document.createElement('div');
	targetSection.className = 'form-section';

	const stepsSection = document.createElement('div');
	stepsSection.className = 'form-section';

	renderTargetSection(targetSection);
	renderStepsSection(stepsSection);
	
	
	form.appendChild(languageSelectDiv);
	form.appendChild(targetSection);
	form.appendChild(stepsSection);
	container.appendChild(form);

	let inputJSONtitle = document.getElementById("inputJSONtitle");
	inputJSONtitle.textContent = UItranslations.inputJsonTitle[currentLanguage];
	let loadQueryButton = document.getElementById("loadButton");
	loadQueryButton.textContent = UItranslations.loadQueryButton[currentLanguage];
	// let generateQueryButton = document.getElementById("generateButton");
	// generateButton.textContent = UItranslations.GenerateQueryButtonText[currentLanguage];
	// let outputJSONtitle = document.getElementById("outputJSONtitle");
	// outputJSONtitle.textContent = UItranslations.OutputJSONTitle[currentLanguage];
	let sendQueryButton = document.getElementById("sendQueryButton");
	sendQueryButton.textContent = UItranslations.SendQueryButtonText[currentLanguage];
	let inputJSONTextarea = document.getElementById("inputJSON");
	inputJSONTextarea.placeholder = UItranslations.inputJSONPlaceholder[currentLanguage];
	// let outputJSONTextarea = document.getElementById("outputJSON");
	// outputJSONTextarea.placeholder = UItranslations.outputJSONPlaceholder[currentLanguage];
	
	const selects = document.querySelectorAll('select');
	initializeSelects(selects);
	
	document.querySelectorAll('details').forEach(details => {
		const saved = localStorage.getItem('details:' + details.id);
		if (saved !== null) { details.open = saved === 'open'; }

		details.addEventListener('toggle', () => {
			console.log('details toggle hit');
			localStorage.setItem('details:' + details.id, details.open ? 'open' : 'closed');
		});
	});
}

function initializeSelects(selects) {
	M.FormSelect.init(selects, { dropdownOptions: {constrainWidth: false }});

	const textHolder = document.querySelector('.select-text-holder');

	selects.forEach(sel => {
		const adapt = () => {
			requestAnimationFrame(() => {
				const wrapper = sel.parentElement;
				const input = wrapper.querySelector('input.select-dropdown');	
				const options = wrapper.querySelector('ul');
				const selected = options.querySelector('.selected');
				const span = selected.querySelector('span');
				textHolder.style.font = getComputedStyle(input).font;
				textHolder.textContent = span.textContent;
				const currWidth = textHolder.offsetWidth + 40;
				input.style.width = currWidth + 'px';
				wrapper.style.width = currWidth + 'px';

			});
			
		};
			
		adapt();
		sel.addEventListener('change', adapt);	
	});
	
}


function renderStepsSection(container) {
	// Title
	const stepsTitle = document.createElement('h5');
	stepsTitle.textContent = UItranslations.StepsTitle[currentLanguage];
	container.appendChild(stepsTitle);

	const stepsContainer = document.createElement('div');
	stepsContainer.className = 'steps repeatable-container';

	queryObject.steps.forEach((step, stepIndex) => {
		userDefinedAliases.push([]);
		const stepRow = document.createElement('details');
		stepRow.id = `step_${stepIndex}`;
		stepRow.setAttribute('open', '');
		const summary = document.createElement('summary');
		// let columnsToBeReturned = '';
		stepRow.addEventListener('UpdateStepPreview', () => {
			let columnsToBeReturned = '';
			queryObject.steps[stepIndex].columns.forEach(col => {
				var hit = false;
				if (typeof(col) === "object") {
					columnsToBeReturned += col.alias ? ` ${col.alias}` : `${translations[col.agg_func][currentLanguage]}(${translations[col.real][currentLanguage]})`;
					hit = true;
				}
				if (!hit) {
					Object.keys(artificialColumns).forEach(key => {
						if (artificialColumns[key].formula === col) {
							columnsToBeReturned += ` ${translations[key][currentLanguage]}`;
							hit = true;
							return;
						}
					});
				}
				if (!hit && col.includes('step_result')) {
					columnsToBeReturned += translateStepResults(col, translations, artificialColumns, currentLanguage);		
				}
				if (!hit) {
					columnsToBeReturned += ` ${translations[col][currentLanguage]}`;
				}
			});
			const stepSummary = stepRow.querySelector('summary');
			stepSummary.textContent = `${queryObject.steps[stepIndex].goal} -> ${columnsToBeReturned}`;
		});
		
		stepRow.appendChild(summary)
		stepRow.className = 'repeatable-row-step';
		stepRow.setAttribute('data-step-index', stepIndex);
		// Goal of the step
		const goalDiv = document.createElement('div');
		goalDiv.className = `goal_steps_${stepIndex}`;
		const goalLabel = document.createElement('label');
		goalLabel.textContent = UItranslations.StepNameInputLabel[currentLanguage];
		const goalInput = document.createElement('input');
		goalInput.type = 'text';
		goalInput.placeholder = UItranslations.StepNameInputPlaceholder[currentLanguage];
		goalInput.value = step.goal;
		goalInput.addEventListener('input',  () => {
			queryObject.steps[stepIndex].goal = goalInput.value;
			updatePreview();
		});
		goalDiv.appendChild(goalLabel);
		goalDiv.appendChild(goalInput);
		stepRow.appendChild(goalDiv);
		
		// Columns
		const columnsDiv = document.createElement('div');
		columnsDiv.className = `columns`;
		renderColumns(columnsDiv, step, stepIndex);
		stepRow.appendChild(columnsDiv);

		// Aggregation
		const aggregationDiv = document.createElement('div');
		aggregationDiv.className = `aggregation`;
		renderAggregation(aggregationDiv, step, stepIndex);
		stepRow.appendChild(aggregationDiv);
		
		// Filtering
		const filteringDiv = document.createElement('div');
		filteringDiv.className = `filtering`;
		renderFiltering(filteringDiv, step, stepIndex);
		stepRow.appendChild(filteringDiv);

		// Limit
		const limitDiv = document.createElement('div');
		limitDiv.className = `limit`;
		renderLimit(limitDiv, step, stepIndex);
		stepRow.appendChild(limitDiv);

		
		const removeStepButton = document.createElement('a');
		removeStepButton.classList.add('waves-effect');
		removeStepButton.classList.add('waves-dark');
		removeStepButton.classList.add('btn');
		removeStepButton.textContent = "-";
		removeStepButton.onclick = () => {
			queryObject.steps.splice(stepIndex, 1);
			stepResultArray.splice(stepIndex, 1);
			userDefinedAliases.splice(stepIndex, 1);
			renderForm();
		};
		stepRow.appendChild(removeStepButton);

		stepsContainer.appendChild(stepRow);
		storeStepResults(queryObject, stepResultArray, userDefinedAliases, stepIndex)
		
	});

	// const addStepButton = document.createElement('button');
	// addStepButton.type = 'button';
	const addStepButton = document.createElement('a');
	addStepButton.classList.add('waves-effect');
	addStepButton.classList.add('waves-dark');
	addStepButton.classList.add('btn');
	addStepButton.textContent = '+';
	addStepButton.onclick = () => {
		queryObject.steps.push({
			goal: '',
			columns: [],
			aggregation: {
				group_by: [],
				order_by: []
			},
			filtering: {
				conditions: []
			},
			limit: ""
		});
		userDefinedAliases.push([]);
		renderForm();
	};
	container.appendChild(stepsContainer);
	container.appendChild(addStepButton);
}

function renderLimit(container, step, stepIndex) {
	const limitLabel = document.createElement('label');
	limitLabel.textContent = 'Limit';
	container.appendChild(limitLabel);
	const limitInput = document.createElement('input');
	limitInput.type = 'number';
	limitInput.placeholder = 'Limit';
	limitInput.value = typeof step.limit === 'number' ? step.limit : '';
	limitInput.addEventListener('input', () => {
		const value =parseInt(limitInput.value, 10);
		queryObject.steps[stepIndex].limit = isNaN(value) ? "" : value;
		updatePreview();
	});
	if (queryObject.steps[stepIndex].limit != "") {
		limitInput.value = queryObject.steps[stepIndex].limit;
	}
	container.appendChild(limitInput);
}

function renderFiltering(container, step, stepIndex) {
	const filteringTitle = document.createElement('h3');
	filteringTitle.textContent = UItranslations.FilteringSectionTitle[currentLanguage];
	// container.appendChild(filteringTitle);

	const conditionsDiv = document.createElement('div');
	conditionsDiv.className = 'conditions';
	renderConditions(conditionsDiv, step, stepIndex);
	container.appendChild(conditionsDiv);

}

function renderConditions(container, step, stepIndex) {
	const conditionsTitle = document.createElement('h6');
	conditionsTitle.textContent = UItranslations.ConditionsSectionTitle[currentLanguage];
	container.appendChild(conditionsTitle);

	const conditionsContainer = document.createElement('div');
	conditionsContainer.className = 'repeatable-container';
	step.filtering.conditions.forEach((condition, conditionIndex) => {
		const conditionRow = document.createElement('div');
		conditionRow.className = 'repeatable-row-inline';
		conditionRow.setAttribute('data-step-index', stepIndex);
		// ========================== NEW VERSION BEGIN ===========================
		// ######################## NOTES BEGIN #######################
		// TODO: Repeated code at 181-188 and 194-201
		// ######################## NOTES END #########################
		const conditionColumnTableSelect = document.createElement('select');
		conditionColumnTableSelect.classList.add(`column-select-conditions`);
			
		const valueColumnOffering = document.createElement('select');
		valueColumnOffering.addEventListener('change', () => {
			queryObject.steps[stepIndex].filtering.conditions[conditionIndex].value = valueColumnOffering.value;
			updatePreview();
		});
		
		// Offer user columns from available databases
		Utilities.addDatabaseColumnOfferings(metaInformation.columns, conditionColumnTableSelect,
		                                     currentLanguage);
		
		Utilities.addDatabaseColumnOfferings(metaInformation.columns, valueColumnOffering, currentLanguage);

		// Offer user template columns
		Utilities.addArtificialColumnOfferings(conditionColumnTableSelect, currentLanguage);
		Utilities.addArtificialColumnOfferings(valueColumnOffering, currentLanguage);
		// Offer user aliases defined within this step
		if (userDefinedAliases[stepIndex]) {
			Utilities.addUserDefinedAliases(conditionColumnTableSelect, userDefinedAliases[stepIndex]);
			Utilities.addUserDefinedAliases(valueColumnOffering, userDefinedAliases[stepIndex]);
		}

		// Offer user column that are being selected in other steps
		Utilities.addStepResultsOfferings(conditionColumnTableSelect, stepResultArray, stepIndex, currentLanguage);
		Utilities.addStepResultsOfferings(valueColumnOffering, stepResultArray, stepIndex, currentLanguage);
		const defaultOption = document.createElement('option');
		defaultOption.value = '';
		defaultOption.textContent = translations[''][currentLanguage];
		conditionColumnTableSelect.appendChild(defaultOption);
		conditionColumnTableSelect.addEventListener('change', () => {
			queryObject.steps[stepIndex].filtering.conditions[conditionIndex].column = conditionColumnTableSelect.value;
			
			Utilities.UpdateConditionValuePossibilities(userDefinedAliases, stepResultArray, queryObject.target_databases)

			Utilities.UpdateValueColumnOfferings(valueColumnOffering, userDefinedAliases, stepResultArray, 
				                                 stepIndex, currentLanguage);
			
			M.FormSelect.init(valueColumnOffering);
			updatePreview();
		});

		if (!condition.column) {
			condition.column = '';
			conditionColumnTableSelect.value = '';
		} else {
			conditionColumnTableSelect.value = condition.column;
		}
		
		
		
		const conditionOperatorSelect = document.createElement('select');
		const operators = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "NOT IN", "IS NOT"];
		operators.forEach(oper => {
			const operatorOption = document.createElement('option');
			operatorOption.value = oper;
			operatorOption.textContent = oper;
			conditionOperatorSelect.appendChild(operatorOption);
		});
		conditionOperatorSelect.value = condition.operator;
		conditionOperatorSelect.addEventListener('change', () => {
			queryObject.steps[stepIndex].filtering.conditions[conditionIndex].operator = conditionOperatorSelect.value;
			updatePreview();
		});

		const conditionValueInputDiv = document.createElement('div');
		conditionValueInputDiv.className = "input-field";
		const conditionValueInput = document.createElement('input');
		conditionValueInput.classList.add("autocomplete");
		conditionValueInput.classList.add("value-input");
		conditionValueInput.placeholder = "Enter value here."
		
		if (condition.value) {
			let done = false;
			let options = valueColumnOffering.querySelectorAll('option');
			options.forEach(option => {
				if (option.value === condition.value) {
					conditionValueInput.value = "";
					valueColumnOffering.value = condition.value; 
					done=true; }
			});
			if (!done) {
				valueColumnOffering.value = "";
				conditionValueInput.value = condition.value;	 
			}
			conditionValueInput.dispatchEvent(new Event('input', {bubbles:true}));
		}
		conditionValueInput.addEventListener('input', () => {
			queryObject.steps[stepIndex].filtering.conditions[conditionIndex].value = `'${conditionValueInput.value}'`;
			Utilities.UpdateConditionValuePossibilities2(conditionValueInput, conditionColumnTableSelect.value,
			                                             userDefinedAliases, stepResultArray, stepIndex, queryObject.target_databases)
			updatePreview();
		});
		conditionValueInputDiv.appendChild(conditionValueInput);

		
		const removeConditionButton = document.createElement('a');
		removeConditionButton.classList.add('wave-effect');
		removeConditionButton.classList.add('wave-dark');
		removeConditionButton.classList.add('btn');
		removeConditionButton.textContent = '-';
		removeConditionButton.onclick = () => {
			queryObject.steps[stepIndex].filtering.conditions.splice(conditionIndex, 1);
			renderForm();
		};
		
		
		conditionRow.appendChild(conditionColumnTableSelect);
		conditionRow.appendChild(conditionOperatorSelect);
		conditionRow.appendChild(conditionValueInputDiv);
		conditionRow.appendChild(valueColumnOffering);
		conditionRow.appendChild(removeConditionButton);
		
		conditionsContainer.appendChild(conditionRow);
	});

	// const addConditionButton = document.createElement('button');
	// addConditionButton.type = 'button';
	const addConditionButton = document.createElement('a');
	addConditionButton.classList.add("wave-effect");
	addConditionButton.classList.add("wave-dark");
	addConditionButton.classList.add("btn");
	addConditionButton.textContent = '+';
	addConditionButton.onclick = () => {
		queryObject.steps[stepIndex].filtering.conditions.push({column:"", operator:"=", value:""});
		renderForm();
	};

	container.appendChild(conditionsContainer);
	container.appendChild(addConditionButton);
}

function renderAggregation(container, step, stepIndex) {
	const aggregationTitle = document.createElement('h3');
	aggregationTitle.textContent = UItranslations.AggregationSectionTitle[currentLanguage];
	// container.appendChild(aggregationTitle);

	const groupByDiv = document.createElement('div');
	groupByDiv.className = 'group-by';
	renderGroupBy(groupByDiv, step, stepIndex);
	container.appendChild(groupByDiv);

	const orderByDiv = document.createElement('div');
	orderByDiv.className = 'order-by';
	renderOrderBy(orderByDiv, step, stepIndex);
	container.appendChild(orderByDiv);

}

function renderOrderBy(container, step, stepIndex) {
	const orderByTitle = document.createElement('h6');
	orderByTitle.textContent = UItranslations.OrderBySectionTitle[currentLanguage];
	container.appendChild(orderByTitle);

	const orderByContainer = document.createElement('div');
	orderByContainer.className = 'repeatable-container';
	step.aggregation.order_by.forEach((orderByEntry, orderByIndex) => {
		const orderByRow = document.createElement('div');
		orderByRow.className = 'repeatable-row-inline';
		orderByRow.setAttribute('data-step-index', stepIndex);
		const orderByTableSelect = document.createElement('select');
		orderByTableSelect.className = `column-select`;
		

		const orderByAggregationSelect = document.createElement('select');
		orderByAggregationSelect.className = "agg-select";
		// Make aggregation functions offerings
		Utilities.makeAggregationFunctionSelect(metaInformation.columns, orderByAggregationSelect,
		                                        currentLanguage, 
		                                        queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column,
		                                        aggregationFunctionTypeMapping, userDefinedAliases[stepIndex], stepResultArray);

		
		// Add change handler
		orderByAggregationSelect.addEventListener('change', function (event) {
			if (typeof queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column === "string") {
				queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column = {
					"real":orderByTableSelect.value,
					"agg_func":orderByAggregationSelect.value
				}
			} else if (typeof queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column === "object") {
				if (event.target.selectedOptions[0].value === "") {
					queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column = orderByTableSelect.value;
				} else {
					queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column.agg_func = orderByAggregationSelect.value;
				}
			}
			updatePreview();
		});

		if (typeof queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column === "object") {
			orderByAggregationSelect.value = translations[queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column.agg_func][currentLanguage];
		} else {
			orderByAggregationSelect.value = "";
		}

		// Offer user columns from available databases
		Utilities.addDatabaseColumnOfferings(metaInformation.columns,
		                                     orderByTableSelect,
		                                     currentLanguage);

		// Offer user template columns
		Utilities.addArtificialColumnOfferings(orderByTableSelect, currentLanguage);

		// Offer user aliases defined within the same step
		Utilities.addUserDefinedAliases(orderByTableSelect, userDefinedAliases[stepIndex]);
		
		// Offer user columns selected in other steps
		Utilities.addStepResultsOfferings(orderByTableSelect, stepResultArray, stepIndex, currentLanguage);

		// Add default option
		const defaultOption = document.createElement('option');
		defaultOption.value = ''
		defaultOption.textContent = translations[''][currentLanguage];
		orderByTableSelect.appendChild(defaultOption);

		// Handle loading into form fields
		if (!orderByEntry.column) {
			orderByTableSelect.value = "";
		} else {
			if (typeof orderByEntry.column === "object") {
				orderByTableSelect.value = orderByEntry.column.real;
			} else {
				orderByTableSelect.value = orderByEntry.column;
			}
			orderByTableSelect.dispatchEvent(new Event('change'));
		}

		// Offer aggregation function options based on selected column type

		orderByTableSelect.addEventListener('change', () => {
			if (typeof queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column === "object") {
				queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column.real = orderByTableSelect.value;
			} else  {
				queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column = orderByTableSelect.value;
			}
			orderByAggregationSelect.value = "";
			Utilities.updateAllAggregationSelects(userDefinedAliases, stepResultArray, 
												  aggregationFunctionTypeMapping,
												  currentLanguage);
			M.FormSelect.init(orderByAggregationSelect);
			updatePreview();
		});
		
		const orderByDirectionSelect = document.createElement('select');
		
		const ascendingOption = document.createElement('option');
		ascendingOption.value = 'ASC';
		ascendingOption.textContent = UItranslations.OrderByAscendingDirection[currentLanguage];
		const descendingOption = document.createElement('option');
		descendingOption.value = 'DESC';
		descendingOption.textContent = UItranslations.OrderByDescendingDirection[currentLanguage];

		orderByDirectionSelect.appendChild(ascendingOption);
		orderByDirectionSelect.appendChild(descendingOption);
		orderByDirectionSelect.value = orderByEntry.direction || 'ASC';
		orderByDirectionSelect.addEventListener('change', () => {
			queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].direction = orderByDirectionSelect.value;
			updatePreview();
		});
		
		// const removeOrderByButton = document.createElement('button');
		// removeOrderByButton.type = 'button';
		const removeOrderByButton = document.createElement('a');
		removeOrderByButton.classList.add('wave-effect');
		removeOrderByButton.classList.add('wave-dark');
		removeOrderByButton.classList.add('btn');
		removeOrderByButton.textContent = '-';
		removeOrderByButton.onclick = () => {
			queryObject.steps[stepIndex].aggregation.order_by.splice(orderByIndex, 1);
			renderForm();
		};
		orderByRow.appendChild(orderByAggregationSelect);
		// orderByRow.appendChild(orderByColumnInput);
		orderByRow.appendChild(orderByTableSelect);
		// orderByRow.appendChild(orderByColumnSelect);
		orderByRow.appendChild(orderByDirectionSelect);
		orderByRow.appendChild(removeOrderByButton);

		orderByContainer.appendChild(orderByRow);
	});

	// const addOrderByButton = document.createElement('button');
	// addOrderByButton.type = 'button';
	const addOrderByButton = document.createElement('a');
	addOrderByButton.classList.add('wave-effect');
	addOrderByButton.classList.add('wave-dark');
	addOrderByButton.classList.add('btn');
	addOrderByButton.textContent = '+';
	addOrderByButton.onclick = () => {
		queryObject.steps[stepIndex].aggregation.order_by.push({column:"", direction:"ASC"});
		renderForm();
	};

	container.appendChild(orderByContainer);
	container.appendChild(addOrderByButton);
}

function renderGroupBy(container, step, stepIndex) {
	const groupByTitle = document.createElement('h6');
	groupByTitle.textContent = UItranslations.GroupBySectionTitle[currentLanguage];
	container.appendChild(groupByTitle);

	const groupByContainer = document.createElement('div');
	groupByContainer.className = 'repeatable-container';
	step.aggregation.group_by.forEach((gbColumn, gbColumnIndex) => {
		// let gbColumnParts = gbColumn.split('.');
		const groupByRow = document.createElement('div');
		groupByRow.className = 'repeatable-row-inline';
		groupByRow.setAttribute('data-step-index', stepIndex);
		// =========================== NEW VERSION BEGIN ============================
		const groupByTableSelect = document.createElement('select');
		groupByTableSelect.className = `column-select`;
		const groupByColumnSelect = document.createElement('select');
		
		// Offer aggregation functions
		const groupByAggregationSelect = document.createElement('select');
		groupByAggregationSelect.className = "agg-select";
		Utilities.makeAggregationFunctionSelect(metaInformation.columns, groupByAggregationSelect, currentLanguage,
									  queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex],
		 							  aggregationFunctionTypeMapping, userDefinedAliases[stepIndex], stepResultArray);
		
		// Add change handling
		groupByAggregationSelect.addEventListener('change', function (event) {
			if (typeof queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] === "string") {
				queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] = {
					"real":groupByTableSelect.value,
					"agg_func":groupByAggregationSelect.value
				}
			} else if (typeof queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] === "object") {
				if (event.target.selectedOptions[0].value === "") {
					queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] = groupByTableSelect.value;
				} else {
					queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex].agg_func = groupByAggregationSelect.value;
				}
			}
			updatePreview();
		});

		if (typeof queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] === "object") {
			groupByAggregationSelect.value = queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex].agg_func;
		} else {
			groupByAggregationSelect.value = "";
		}

		// Offer user columns available in databases
		Utilities.addDatabaseColumnOfferings(metaInformation.columns, groupByTableSelect, currentLanguage);
		
		// Offer user template columns
		Utilities.addArtificialColumnOfferings(groupByTableSelect, currentLanguage);

		// Offer user aliases defined within this step
		
		if (userDefinedAliases[stepIndex]) { 
			Utilities.addUserDefinedAliases(groupByTableSelect, userDefinedAliases[stepIndex]);
		}

		// Offer user columns that are to be selected in other steps
		Utilities.addStepResultsOfferings(groupByTableSelect, stepResultArray, stepIndex, currentLanguage);
		
		const defaultOption = document.createElement('option');
		defaultOption.value = '';
		defaultOption.textContent = translations[''][currentLanguage];
		groupByTableSelect.appendChild(defaultOption);
		
		if (!gbColumn) {
			groupByTableSelect.value = "";
		} else {
			if (typeof gbColumn === "object") {
				groupByTableSelect.value = gbColumn.real;
			} else if (typeof gbColumn === "string") {
				groupByTableSelect.value = gbColumn;
			}
			groupByTableSelect.dispatchEvent(new Event('change'));
		}

		// Update aggregation offerings based on selected column type
		// Store selection
		groupByTableSelect.addEventListener('change', () => {
			queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] = groupByTableSelect.value;
			groupByAggregationSelect.value = "";
			Utilities.updateAllAggregationSelects(userDefinedAliases, stepResultArray,
												  aggregationFunctionTypeMapping,
												  currentLanguage);		
			M.FormSelect.init(groupByAggregationSelect);
			updatePreview();
		});
		
	
		// ========================== NEW VERSION END ==============================
		
		// const removeGroupByButton = document.createElement('button');
		// removeGroupByButton.type = 'button';
		const removeGroupByButton = document.createElement('a');
		removeGroupByButton.classList.add('wave-effect');
		removeGroupByButton.classList.add('wave-dark');
		removeGroupByButton.classList.add('btn');
		removeGroupByButton.textContent = '-';
		removeGroupByButton.onclick = () => {
			queryObject.steps[stepIndex].aggregation.group_by.splice(gbColumnIndex, 1);
			renderForm()
		}
		groupByRow.appendChild(groupByAggregationSelect);
		groupByRow.appendChild(groupByTableSelect);
		groupByRow.appendChild(removeGroupByButton);
		groupByContainer.appendChild(groupByRow);
	});

	// const addGroupByButton = document.createElement('button');
	// addGroupByButton.type = 'button';
	const addGroupByButton = document.createElement('a');
	addGroupByButton.classList.add('wave-effect');
	addGroupByButton.classList.add('wave-dark');
	addGroupByButton.classList.add('btn');
	addGroupByButton.textContent = '+';
	addGroupByButton.onclick = () => {
			queryObject.steps[stepIndex].aggregation.group_by.push("");
			renderForm();
		};
		container.appendChild(groupByContainer);
		container.appendChild(addGroupByButton);
	}

	function renderColumns(container, step, stepIndex) {
		const columnsTitle = document.createElement('h6');
		columnsTitle.textContent = UItranslations.columnsHeader[currentLanguage];
		container.appendChild(columnsTitle);

		const columnsContainer = document.createElement('div');
		columnsContainer.className = 'repeatable-container';
		step.columns.forEach((column, columnIndex) => {
			const columnRow = document.createElement('div');
			columnRow.className = 'repeatable-row-inline';
			columnRow.setAttribute('data-step-index', stepIndex);
			// ====================== NEW VERSION BEGIN ==============================
			// ######################## NOTES BEGIN #######################
			// ######################## NOTES END #########################
			// let columnParts = column.split('.');
			const columnTableSelect = document.createElement('select');
			columnTableSelect.className = `column-select-${stepIndex}`;
			// Alias input field
			const aliasInputField = document.createElement('input');
			aliasInputField.type = 'text';
			aliasInputField.placeholder = 'Type alias here.'
			
			aliasInputField.addEventListener('input', (e) => {
				if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "string") {
					queryObject.steps[stepIndex].columns[columnIndex] = {
						"real":columnTableSelect.value,
						"alias":aliasInputField.value,
						"agg_func":aggregationFunctionSelect.value
					};
				} else if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "object") {
					queryObject.steps[stepIndex].columns[columnIndex].alias = aliasInputField.value;
				}
				storeAliases(queryObject, userDefinedAliases, stepResultArray, stepIndex);
				storeStepResults(queryObject, stepResultArray, userDefinedAliases, stepIndex);
				updateColumnsOfferings2(userDefinedAliases, stepResultArray, queryObject.steps.length);
				updatePreview();
				const ev = createPreviewUpdateEvent(42);
				e.currentTarget.dispatchEvent(ev);
			});

			// Aggregation function select
			const aggregationFunctionSelect = document.createElement('select');
			aggregationFunctionSelect.className = "agg-select";
			Utilities.makeAggregationFunctionSelect(metaInformation.columns, aggregationFunctionSelect, 
			                              currentLanguage, queryObject.steps[stepIndex].columns[columnIndex],
			                              aggregationFunctionTypeMapping, userDefinedAliases[stepIndex], stepResultArray);
			
			// Store selected aggregation function
			aggregationFunctionSelect.addEventListener('change', (e) => {
				if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "string") {
					queryObject.steps[stepIndex].columns[columnIndex] = {
						"real":columnTableSelect.value,
						"alias":aliasInputField.value,
						"agg_func":aggregationFunctionSelect.value
					}
				} else if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "object") {
						queryObject.steps[stepIndex].columns[columnIndex].agg_func = aggregationFunctionSelect.value;
				}
				updatePreview();
				const ev = createPreviewUpdateEvent(42);
				e.currentTarget.dispatchEvent(ev);
			});

			// Load aggregation function and alias into form fields
			if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "object") {
				aliasInputField.value = queryObject.steps[stepIndex].columns[columnIndex].alias;
				aggregationFunctionSelect.value = queryObject.steps[stepIndex].columns[columnIndex].agg_func;
			} else {
				aliasInputField.value = "";
				aggregationFunctionSelect.value = "";
			}
			
			// Offer the user choice of database tables
			Utilities.addDatabaseColumnOfferings(metaInformation.columns, columnTableSelect, currentLanguage);
			
			// Offer the user choice of template columns
			Utilities.addArtificialColumnOfferings(columnTableSelect, currentLanguage);

			// Offer results of previous steps
			Utilities.addStepResultsOfferings(columnTableSelect, stepResultArray, stepIndex, currentLanguage);
		
			// Add default option
			let defaultOption = document.createElement('option');
			defaultOption.value = '';
			defaultOption.textContent = translations[''][currentLanguage];
			columnTableSelect.appendChild(defaultOption);
			
			

			if (!column) {
				columnTableSelect.value = "";
			} else {
				if (typeof column === "string") {
					columnTableSelect.value = column;
				} else if (typeof column === "object") {
					columnTableSelect.value = column.real;
				}
			}
			
			// Limit aggregation function offers based on type
			

			// Store changes
			// columnTableSelect.addEventListener('change', function(event) {
			columnTableSelect.addEventListener('change', (e) => {
				aliasInputField.value = "";
				queryObject.steps[stepIndex].columns[columnIndex] = columnTableSelect.value;
				aggregationFunctionSelect.value = "";
				Utilities.updateAllAggregationSelects(userDefinedAliases, stepResultArray,
													  aggregationFunctionTypeMapping,
													  currentLanguage);
				storeStepResults(queryObject, stepResultArray, userDefinedAliases, stepIndex);
				
				updateColumnsOfferings(userDefinedAliases, stepResultArray, stepIndex);
				
				M.FormSelect.init(aggregationFunctionSelect);
				updatePreview();
				const ev = createPreviewUpdateEvent(42);
				e.currentTarget.dispatchEvent(ev);
			});

			
		
			// ====================== NEW VERSION END ================================

			// const removeColumnButton = document.createElement('button');
			// removeColumnButton.type = 'button';
			const removeColumnButton = document.createElement('a');
			removeColumnButton.classList.add('wave-effect');
			removeColumnButton.classList.add('wave-dark');
			removeColumnButton.classList.add('btn');
			removeColumnButton.textContent = '-';
			removeColumnButton.onclick = () => {
				queryObject.steps[stepIndex].columns.splice(columnIndex, 1);
				renderForm();
			}
			storeAliases(queryObject, userDefinedAliases, stepResultArray, stepIndex);
			storeStepResults(queryObject, stepResultArray, userDefinedAliases, stepIndex);
			updateColumnsOfferings2(userDefinedAliases, stepResultArray, queryObject.steps.length);
			if (!column) {
				columnTableSelect.value = "";
			} else {
				if (typeof column === "string") {
					columnTableSelect.value = column;
				} else if (typeof column === "object") {
					columnTableSelect.value = column.real;
				}
			}		
			columnRow.appendChild(aggregationFunctionSelect);
			columnRow.appendChild(columnTableSelect);
			columnRow.appendChild(aliasInputField);
			columnRow.appendChild(removeColumnButton);
			columnsContainer.appendChild(columnRow);
		});

		// const addColumnButton = document.createElement('button');
		// addColumnButton.type = 'button';
		const addColumnButton = document.createElement('a');
		addColumnButton.classList.add('wave-effect');
		addColumnButton.classList.add('wave-dark');
		addColumnButton.classList.add('btn');
		addColumnButton.textContent = '+';
		addColumnButton.onclick = () => {
		queryObject.steps[stepIndex].columns.push("");
		renderForm();
	};
	storeStepResults(queryObject, stepResultArray, userDefinedAliases, stepIndex)
	container.appendChild(columnsContainer);
	container.appendChild(addColumnButton);
}

function renderTargetSection(container) {
	// Title
	const targetTitle = document.createElement('h5');
	targetTitle.textContent = UItranslations.targetDatabaseSectionTitle[currentLanguage];
	container.appendChild(targetTitle);

	// Target databases
	const targetDatabasesDiv = document.createElement('div');
	targetDatabasesDiv.className = 'targetDatabase(s)';
	const targetDatabaseTitle = document.createElement('h6');
	targetDatabaseTitle.textContent = UItranslations.targetDatabaseTitle[currentLanguage];
	targetDatabasesDiv.appendChild(targetDatabaseTitle);

	const targetDatabasesContainer = document.createElement('div');
	targetDatabasesContainer.className = 'repeatable-container';

	queryObject.target_databases.forEach((database, databaseIndex) => {
		const row = document.createElement('div');
		row.className = 'repeatable-row';
		// ========================== NEW ===============================
		const newInput = document.createElement('select');
		// let databases = getAvailableDatabases(); 
		// console.log(databases);
		metaInformation.available_databases.forEach(databaseName => {
			const option = document.createElement('option');
			option.value = databaseName;
			option.textContent = databaseName;
			newInput.appendChild(option);
		});

		const defaultOption = document.createElement('option');
		defaultOption.value = '';
		defaultOption.textContent = translations[''][currentLanguage];
		newInput.appendChild(defaultOption);
		if (!queryObject.target_databases[databaseIndex]) {
			newInput.value = '';
		} else {
			newInput.value = queryObject.target_databases[databaseIndex];
			newInput.dispatchEvent(new Event('change'));
		}

		newInput.addEventListener('change', () => {
			queryObject.target_databases[databaseIndex] = newInput.value;
			updatePreview();
		});
		// ======================= END NEW ==============================
		// const removeButton = document.createElement('button');
		// removeButton.type = 'button';
		const removeButton = document.createElement('a');
		removeButton.classList.add('wave-effect');
		removeButton.classList.add('wave-dark');
		removeButton.classList.add('btn');
		removeButton.textContent = '-';
		removeButton.onclick = () => {
			queryObject.target_databases.splice(databaseIndex, 1);
			renderForm();
		};
		row.appendChild(newInput);
		row.appendChild(removeButton);
		targetDatabasesContainer.appendChild(row);
	});

	// const addButton = document.createElement('button');
	// addButton.type = 'button';
	const addButton = document.createElement('a');
	addButton.classList.add('wave-effect');
	addButton.classList.add('wave-dark');
	addButton.classList.add('btn');
	addButton.textContent = '+';
	addButton.onclick = () => {
		queryObject.target_databases.push("");
		renderForm();
	};
	targetDatabasesDiv.appendChild(targetDatabasesContainer)
	targetDatabasesDiv.appendChild(addButton);
	
	// Description
	const descriptionDiv = document.createElement('div');
	descriptionDiv.className = 'description';
	const descriptionLabel = document.createElement('label');
	descriptionLabel.textContent = UItranslations.DescriptionLabel[currentLanguage];
	const descriptionInput = document.createElement('input');
	descriptionInput.type = 'text';
	descriptionInput.placeholder = UItranslations.DescriptionInputPlaceHolder[currentLanguage];
	descriptionInput.value = queryObject.description;
	descriptionInput.addEventListener('input', () => {
		queryObject.description = descriptionInput.value;
		updatePreview();
	});
	descriptionDiv.appendChild(descriptionLabel);
	descriptionDiv.appendChild(descriptionInput);

	container.appendChild(targetDatabasesDiv);
	container.appendChild(descriptionDiv);
	
}

function loadQuery(jsonString) {
	queryObject = JSON.parse(jsonString);
	renderForm();
}


// const generateButton = document.getElementById('generateButton');
// generateButton.onclick = () => {
// 	const outputJsonField = document.getElementById('outputJSON');
// 	const jsonString = JSON.stringify(queryObject, null, 2);
// 	outputJsonField.value = jsonString;

// 	autoResizeTextarea(outputJsonField);
// };

const sendQueryButton = document.getElementById('sendQueryButton');
sendQueryButton.onclick = async () => {
	try {
		const query = JSON.stringify(queryObject, null, 2);
		const queryWrapped = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: query
		}
		const response = await fetch(testServerURL, queryWrapped);
		if (!response.ok) {
			throw new Error(`HTTP Error! Status: ${response.status}`);
		}
		const responseData = await response.json();
		visualizeAsTable(responseData);
		visualizeAsGraph(responseData, queryObject, 'bar');
		bindButtons(responseData, queryObject);
	} catch (error) {
		console.log(error);
	}
}

function visualizeResponseInTable(responseData) {
	const visualizationDiv = document.getElementById("results-table-wrapper");
	visualizationDiv.innerHTML = '';
	var table = document.createElement("table");
	var tableHeader = document.createElement("thead");
	var headerRow = document.createElement("tr");

	// Header Construction
	var columnNames = Object.keys(responseData[1][0]);

	columnNames.forEach(columnName => {
		var th = document.createElement("th");
		th.textContent = columnName;
		headerRow.appendChild(th);
	});

	tableHeader.appendChild(headerRow);
	table.appendChild(tableHeader)
	
	// Body construction
	var tableBody = document.createElement("tbody");
	responseData[1].forEach(row => {
		var tableRow = document.createElement("tr");
		columnNames.forEach(columnName => {
			var td = document.createElement("td");
			td.textContent = row[columnName];
			tableRow.appendChild(td);
		});
		tableBody.appendChild(tableRow);
	});
	table.appendChild(tableBody);
	visualizationDiv.appendChild(table);

}

function autoResizeTextarea(textarea) {
	textarea.style.height = '1000px';
	textarea.style.width = '800px';
}

const inputJsonField = document.getElementById('inputJSON');
// const outputJsonField = document.getElementById('outputJSON');

inputJsonField.addEventListener('input', () => autoResizeTextarea(inputJsonField));
// outputJsonField.addEventListener('input', () => autoResizeTextarea(outputJsonField));

const loadButton = document.getElementById('loadButton');
loadButton.onclick = () => {
	const inputJsonField = document.getElementById('inputJSON');
	const inputJSON = inputJsonField.value.trim();
	if (inputJSON) {
		loadQuery(inputJSON);	
	} else {
		alert("Paste a JSON before loading.")
	}
};

document.addEventListener("DOMContentLoaded", () => {
	renderForm();
	metaInformation = getMetaInformation();
	console.log('aftermeta');
	
});


