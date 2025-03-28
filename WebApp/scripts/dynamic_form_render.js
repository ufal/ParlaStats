import { getMetaInformation } from './metaInformation.js'; 
import { storeAliases, storeStepResults, updateColumnsOfferings2 } from './stored_data_worker.js' 
import { getTranslations, getUITranslations, translateStepResults } from './translations.js'
import { getArtificialColumns } from './artificialColumns.js'
import * as Utilities from './rendering_utilities.js'
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
	let generateQueryButton = document.getElementById("generateButton");
	generateButton.textContent = UItranslations.GenerateQueryButtonText[currentLanguage];
	let outputJSONtitle = document.getElementById("outputJSONtitle");
	outputJSONtitle.textContent = UItranslations.OutputJSONTitle[currentLanguage];
	let sendQueryButton = document.getElementById("sendQueryButton");
	sendQueryButton.textContent = UItranslations.SendQueryButtonText[currentLanguage];
	let inputJSONTextarea = document.getElementById("inputJSON");
	inputJSONTextarea.placeholder = UItranslations.inputJSONPlaceholder[currentLanguage];
	let outputJSONTextarea = document.getElementById("outputJSON");
	outputJSONTextarea.placeholder = UItranslations.outputJSONPlaceholder[currentLanguage];
}

function renderStepsSection(container) {
	// Title
	const stepsTitle = document.createElement('h2');
	stepsTitle.textContent = UItranslations.StepsTitle[currentLanguage];
	container.appendChild(stepsTitle);

	const stepsContainer = document.createElement('div');
	stepsContainer.className = 'steps repeatable-container';

	queryObject.steps.forEach((step, stepIndex) => {
		userDefinedAliases.push([]);
		const stepRow = document.createElement('div');
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
		});
		goalDiv.appendChild(goalLabel);
		goalDiv.appendChild(goalInput);
		stepRow.appendChild(goalDiv);
		
		// Columns
		const columnsDiv = document.createElement('div');
		columnsDiv.className = `columns_steps_${stepIndex}`;
		renderColumns(columnsDiv, step, stepIndex);
		stepRow.appendChild(columnsDiv);

		// Aggregation
		const aggregationDiv = document.createElement('div');
		aggregationDiv.className = `aggregation_steps_${stepIndex}`;
		renderAggregation(aggregationDiv, step, stepIndex);
		stepRow.appendChild(aggregationDiv);
		
		// Filtering
		const filteringDiv = document.createElement('div');
		filteringDiv.className = `filtering_steps_${stepIndex}`;
		renderFiltering(filteringDiv, step, stepIndex);
		stepRow.appendChild(filteringDiv);

		// Limit
		const limitDiv = document.createElement('div');
		limitDiv.className = `limit_steps_${stepIndex}`;
		renderLimit(limitDiv, step, stepIndex);
		stepRow.appendChild(limitDiv);

		const removeStepButton = document.createElement('button');
		removeStepButton.type = 'button';
		removeStepButton.textContent = '-';
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

	const addStepButton = document.createElement('button');
	addStepButton.type = 'button';
	addStepButton.textContent = UItranslations.AddStepButtonText[currentLanguage];
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
	});
	if (queryObject.steps[stepIndex].limit != "") {
		limitInput.value = queryObject.steps[stepIndex].limit;
	}
	container.appendChild(limitInput);
}

function renderFiltering(container, step, stepIndex) {
	const filteringTitle = document.createElement('h3');
	filteringTitle.textContent = UItranslations.FilteringSectionTitle[currentLanguage];
	container.appendChild(filteringTitle);

	const conditionsDiv = document.createElement('div');
	conditionsDiv.className = 'conditions';
	renderConditions(conditionsDiv, step, stepIndex);
	container.appendChild(conditionsDiv);

}

function renderConditions(container, step, stepIndex) {
	const conditionsTitle = document.createElement('h3');
	conditionsTitle.textContent = UItranslations.ConditionsSectionTitle[currentLanguage];
	container.appendChild(conditionsTitle);

	const conditionsContainer = document.createElement('div');
	conditionsContainer.className = 'repeatable-container';
	step.filtering.conditions.forEach((condition, conditionIndex) => {
		const conditionRow = document.createElement('div');
		conditionRow.className = 'repeatable-row';
		conditionRow.setAttribute('data-step-index', stepIndex);
		// ========================== NEW VERSION BEGIN ===========================
		// ######################## NOTES BEGIN #######################
		// TODO: Repeated code at 181-188 and 194-201
		// ######################## NOTES END #########################
		const conditionColumnTableSelect = document.createElement('select');
		conditionColumnTableSelect.className = `column-select-conditions`;
		
		// Offer user columns from available databases
		Utilities.addDatabaseColumnOfferings(metaInformation.filtering.column, conditionColumnTableSelect,
		                                     currentLanguage);

		// Offer user template columns
		Utilities.addArtificialColumnOfferings(conditionColumnTableSelect, currentLanguage);

		// Offer user aliases defined within this step
		if (userDefinedAliases[stepIndex]) {
			Utilities.addUserDefinedAliases(conditionColumnTableSelect, userDefinedAliases[stepIndex]);
		}

		// Offer user column that are being selected in other steps
		Utilities.addStepResultsOfferings(conditionColumnTableSelect, stepResultArray, stepIndex, currentLanguage);

		if (!condition.column) {
			condition.column = conditionColumnTableSelect.options[0].value;
			conditionColumnTableSelect.value = conditionColumnTableSelect.options[0].value;
		} else {
			conditionColumnTableSelect.value = condition.column;
		}

		conditionColumnTableSelect.addEventListener('change', () => {
			queryObject.steps[stepIndex].filtering.conditions[conditionIndex].column = conditionColumnTableSelect.value;
		});
		
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
		});

		const conditionValueInput = document.createElement('input');
		conditionValueInput.type = 'text';
		conditionValueInput.placeholder = 'Value';
		conditionValueInput.value = condition.value;
		conditionValueInput.addEventListener('input', () => {
			queryObject.steps[stepIndex].filtering.conditions[conditionIndex].value = conditionValueInput.value;
		});

		const removeConditionButton = document.createElement('button');
		removeConditionButton.type = 'button';
		removeConditionButton.textContent = '-';
		removeConditionButton.onclick = () => {
			queryObject.steps[stepIndex].filtering.conditions.splice(conditionIndex, 1);
			renderForm();
		};

		conditionRow.appendChild(conditionColumnTableSelect);
		conditionRow.appendChild(conditionOperatorSelect);
		conditionRow.appendChild(conditionValueInput);
		conditionRow.appendChild(removeConditionButton);

		conditionsContainer.appendChild(conditionRow);
	});

	const addConditionButton = document.createElement('button');
	addConditionButton.type = 'button';
	addConditionButton.textContent = UItranslations.AddConditionButtonText[currentLanguage];
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
	container.appendChild(aggregationTitle);

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
	const orderByTitle = document.createElement('h3');
	orderByTitle.textContent = UItranslations.OrderBySectionTitle[currentLanguage];
	container.appendChild(orderByTitle);

	const orderByContainer = document.createElement('div');
	orderByContainer.className = 'repeatable-container';
	step.aggregation.order_by.forEach((orderByEntry, orderByIndex) => {
		const orderByRow = document.createElement('div');
		orderByRow.className = 'repeatable-row';
		orderByRow.setAttribute('data-step-index', stepIndex);
		const orderByTableSelect = document.createElement('select');
		orderByTableSelect.className = `column-select`;
		

		const orderByAggregationSelect = document.createElement('select');
		orderByAggregationSelect.className = "agg-select";
		// Make aggregation functions offerings
		Utilities.makeAggregationFunctionSelect(metaInformation.aggregation.order_by, orderByAggregationSelect,
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
		});

		if (typeof queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column === "object") {
			orderByAggregationSelect.value = queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column.agg_func;
		} else {
			orderByAggregationSelect.value = "";
		}

		// Offer user columns from available databases
		Utilities.addDatabaseColumnOfferings(metaInformation.aggregation.order_by,
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
		});
		
		const removeOrderByButton = document.createElement('button');
		removeOrderByButton.type = 'button';
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

	const addOrderByButton = document.createElement('button');
	addOrderByButton.type = 'button';
	addOrderByButton.textContent = UItranslations.AddOrderByButtonText[currentLanguage];
	addOrderByButton.onclick = () => {
		queryObject.steps[stepIndex].aggregation.order_by.push({column:"", direction:"ASC"});
		renderForm();
	};

	container.appendChild(orderByContainer);
	container.appendChild(addOrderByButton);
}

function renderGroupBy(container, step, stepIndex) {
	const groupByTitle = document.createElement('h3');
	groupByTitle.textContent = UItranslations.GroupBySectionTitle[currentLanguage];
	container.appendChild(groupByTitle);

	const groupByContainer = document.createElement('div');
	groupByContainer.className = 'repeatable-container';
	step.aggregation.group_by.forEach((gbColumn, gbColumnIndex) => {
		// let gbColumnParts = gbColumn.split('.');
		const groupByRow = document.createElement('div');
		groupByRow.className = 'repeatable-row';
		groupByRow.setAttribute('data-step-index', stepIndex);
		// =========================== NEW VERSION BEGIN ============================
		const groupByTableSelect = document.createElement('select');
		groupByTableSelect.className = `column-select`;
		const groupByColumnSelect = document.createElement('select');
		
		// Offer aggregation functions
		const groupByAggregationSelect = document.createElement('select');
		groupByAggregationSelect.className = "agg-select";
		Utilities.makeAggregationFunctionSelect(metaInformation.aggregation.group_by, groupByAggregationSelect, currentLanguage,
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
				if (event.target.selectedOptions[0]. value === "") {
					queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] = groupByTableSelect.value;
				} else {
					queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex].agg_func = groupByAggregationSelect.value;
				}
			}
		});

		if (typeof queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] === "object") {
			groupByAggregationSelect.value = queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex].agg_func;
		} else {
			groupByAggregationSelect.value = "";
		}

		// Offer user columns available in databases
		Utilities.addDatabaseColumnOfferings(metaInformation.aggregation.group_by, groupByTableSelect, currentLanguage);
		
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
		}

		// Update aggregation offerings based on selected column type
		// Store selection
		groupByTableSelect.addEventListener('change', () => {
			queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] = groupByTableSelect.value;
			groupByAggregationSelect.value = "";
			Utilities.updateAllAggregationSelects(userDefinedAliases, stepResultArray,
												  aggregationFunctionTypeMapping,
												  currentLanguage);		
			
		});
		
	
		// ========================== NEW VERSION END ==============================
		
		const removeGroupByButton = document.createElement('button');
		removeGroupByButton.type = 'button';
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

	const addGroupByButton = document.createElement('button');
	addGroupByButton.type = 'button';
	addGroupByButton.textContent = UItranslations.AddGroupByButtonText[currentLanguage];
	addGroupByButton.onclick = () => {
			queryObject.steps[stepIndex].aggregation.group_by.push("");
			renderForm();
		};
		container.appendChild(groupByContainer);
		container.appendChild(addGroupByButton);
	}

	function renderColumns(container, step, stepIndex) {
		const columnsTitle = document.createElement('h3');
		columnsTitle.textContent = UItranslations.columnsHeader[currentLanguage];
		container.appendChild(columnsTitle);

		const columnsContainer = document.createElement('div');
		columnsContainer.className = 'repeatable-container';
		step.columns.forEach((column, columnIndex) => {
			const columnRow = document.createElement('div');
			columnRow.className = 'repeatable-row';
			columnRow.setAttribute('data-step-index', stepIndex);
			// ====================== NEW VERSION BEGIN ==============================
			// ######################## NOTES BEGIN #######################
			// ######################## NOTES END #########################
			// let columnParts = column.split('.');
			const columnTableSelect = document.createElement('select');
			columnTableSelect.className = "column-select";
			// Alias input field
			const aliasInputField = document.createElement('input');
			aliasInputField.type = 'text';
			aliasInputField.placeholder = 'Type alias here.'
			
			aliasInputField.addEventListener('input', () => {
				if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "string") {
					queryObject.steps[stepIndex].columns[columnIndex] = {
						"real":columnTableSelect.value,
						"alias":aliasInputField.value,
						"agg_func":aggregationFunctionSelect.value
					};
				} else if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "object") {
					queryObject.steps[stepIndex].columns[columnIndex].alias = aliasInputField.value;
				}
				storeAliases(queryObject, userDefinedAliases, stepIndex);
				storeStepResults(queryObject, stepResultArray, userDefinedAliases, stepIndex);
				updateColumnsOfferings2(userDefinedAliases, stepResultArray, queryObject.steps.length);
			});

			// Aggregation function select
			const aggregationFunctionSelect = document.createElement('select');
			aggregationFunctionSelect.className = "agg-select";
			Utilities.makeAggregationFunctionSelect(metaInformation.columns, aggregationFunctionSelect, 
			                              currentLanguage, queryObject.steps[stepIndex].columns[columnIndex],
			                              aggregationFunctionTypeMapping, userDefinedAliases[stepIndex], stepResultArray);
			
			// Store selected aggregation function
			aggregationFunctionSelect.addEventListener('change', () => {
				if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "string") {
					queryObject.steps[stepIndex].columns[columnIndex] = {
						"real":columnTableSelect.value,
						"alias":aliasInputField.value,
						"agg_func":aggregationFunctionSelect.value
					}
				} else if (typeof queryObject.steps[stepIndex].columns[columnIndex] === "object") {
						queryObject.steps[stepIndex].columns[columnIndex].agg_func = aggregationFunctionSelect.value;
				}
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
			columnTableSelect.addEventListener('change', () => {
				aliasInputField.value = "";
				queryObject.steps[stepIndex].columns[columnIndex] = columnTableSelect.value;
				aggregationFunctionSelect.value = "";
				Utilities.updateAllAggregationSelects(userDefinedAliases, stepResultArray,
													  aggregationFunctionTypeMapping,
													  currentLanguage);
			});

			
		
			// ====================== NEW VERSION END ================================

			const removeColumnButton = document.createElement('button');
			removeColumnButton.type = 'button';
			removeColumnButton.textContent = '-';
			removeColumnButton.onclick = () => {
				queryObject.steps[stepIndex].columns.splice(columnIndex, 1);
				renderForm();
			}
			storeAliases(queryObject, userDefinedAliases, stepIndex);
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

		const addColumnButton = document.createElement('button');
		addColumnButton.type = 'button';
		addColumnButton.textContent = UItranslations.addColumnButtonText[currentLanguage];
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
	const targetTitle = document.createElement('h2');
	targetTitle.textContent = UItranslations.targetDatabaseSectionTitle[currentLanguage];
	container.appendChild(targetTitle);

	// Target databases
	const targetDatabasesDiv = document.createElement('div');
	targetDatabasesDiv.className = 'targetDatabase(s)';
	const targetDatabaseTitle = document.createElement('h3');
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
		
		if (!queryObject.target_databases[databaseIndex]) {
			newInput.value = newInput.options[0].value;
		} else {
			newInput.value = queryObject.target_databases[databaseIndex];
		}

		newInput.addEventListener('change', () => {
			queryObject.target_databases[databaseIndex] = newInput.value;
		});
		// ======================= END NEW ==============================
		const removeButton = document.createElement('button');
		removeButton.type = 'button';
		removeButton.textContent = '-';
		removeButton.onclick = () => {
			queryObject.target_databases.splice(databaseIndex, 1);
			renderForm();
		};
		row.appendChild(newInput);
		row.appendChild(removeButton);
		targetDatabasesContainer.appendChild(row);
	});

	const addButton = document.createElement('button');
	addButton.type = 'button';
	addButton.textContent = UItranslations.targetDatabaseAddButton[currentLanguage];
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


const generateButton = document.getElementById('generateButton');
generateButton.onclick = () => {
	const outputJsonField = document.getElementById('outputJSON');
	const jsonString = JSON.stringify(queryObject, null, 2);
	outputJsonField.value = jsonString;

	// autoResizeTextarea(outputJsonField);
};

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
		visualizeResponseInTable(responseData);
		// document.getElementById("responseJSON").textContent = JSON.stringify(responseData, null, 2);
	} catch (error) {
		// document.getElementById("responseJSON").textContent = `Error ${error}`;

	}
}

function visualizeResponseInTable(responseData) {
	const visualizationDiv = document.getElementById("responseDataTable");
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
	textarea.style.width = 'auto';
	textarea.style.height = 'auto';

	textarea.style.height = textarea.scrollHeight + 'px';
	textarea.style.width = textarea.scrollWidth + 'px';
}

const inputJsonField = document.getElementById('inputJSON');
const outputJsonField = document.getElementById('outputJSON');

inputJsonField.addEventListener('input', () => autoResizeTextarea(inputJsonField));
outputJsonField.addEventListener('input', () => autoResizeTextarea(outputJsonField));

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
	metaInformation = getMetaInformation()
	
});
