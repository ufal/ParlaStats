let queryObject = {
	target_databases: [],
	description: "",
	steps:[]
};

let serverURL = "https://quest.ms.mff.cuni.cz/parlastats/api/query"

function renderForm() {
	console.log(queryObject)
	const container = document.getElementById('formContainer');
	container.innerHTML = '';
	const form = document.createElement('form');
	form.id = 'dynamicForm';

	const targetSection = document.createElement('div');
	targetSection.className = 'form-section';

	const stepsSection = document.createElement('div');
	stepsSection.className = 'form-section';

	renderTargetSection(targetSection);
	renderStepsSection(stepsSection);
	
	

	form.appendChild(targetSection);
	form.appendChild(stepsSection);
container.appendChild(form)
}

function renderStepsSection(container) {
	// Title
	const stepsTitle = document.createElement('h2');
	stepsTitle.textContent = 'Steps';
	container.appendChild(stepsTitle);

	const stepsContainer = document.createElement('div');
	stepsContainer.className = 'steps repeatable-container';

	queryObject.steps.forEach((step, stepIndex) => {
		const stepRow = document.createElement('div');
		stepRow.className = 'repeatable-row-step';

		// Goal of the step
		const goalDiv = document.createElement('div');
		goalDiv.className = `goal_steps_${stepIndex}`;
		const goalLabel = document.createElement('label');
		goalLabel.textContent = 'Name';
		const goalInput = document.createElement('input');
		goalInput.type = 'text';
		goalInput.placeholder = 'goal';
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
			renderForm();
		};
		stepRow.appendChild(removeStepButton);

		stepsContainer.appendChild(stepRow);
	});

	const addStepButton = document.createElement('button');
	addStepButton.type = 'button';
	addStepButton.textContent = 'Add Step';
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
			limit: undefined
		});
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
		queryObject.steps[stepIndex].limit = isNaN(value) ? undefined : value;
	});
	container.appendChild(limitInput);
}

function renderFiltering(container, step, stepIndex) {
	const filteringTitle = document.createElement('h3');
	filteringTitle.textContent = 'Filtering';
	container.appendChild(filteringTitle);

	const conditionsDiv = document.createElement('div');
	conditionsDiv.className = 'conditions';
	renderConditions(conditionsDiv, step, stepIndex);
	container.appendChild(conditionsDiv);

}

function renderConditions(container, step, stepIndex) {
	const conditionsTitle = document.createElement('h3');
	conditionsTitle.textContent = 'Conditions';
	container.appendChild(conditionsTitle);

	const conditionsContainer = document.createElement('div');
	conditionsContainer.className = 'repeatable-container';
	step.filtering.conditions.forEach((condition, conditionIndex) => {
		const conditionRow = document.createElement('div');
		conditionRow.className = 'repeatable-row';

		const conditionColumnInput = document.createElement('input');
		conditionColumnInput.type = 'text';
		conditionColumnInput.placeholder = 'Column';
		conditionColumnInput.value = condition.column;
		conditionColumnInput.addEventListener('input', () => {
			queryObject.steps[stepIndex].filtering.conditions[conditionIndex].column = conditionColumnInput.value;
		});
		
		const conditionOperatorSelect = document.createElement('select');
		const operators = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"];
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

		conditionRow.appendChild(conditionColumnInput);
		conditionRow.appendChild(conditionOperatorSelect);
		conditionRow.appendChild(conditionValueInput);
		conditionRow.appendChild(removeConditionButton);

		conditionsContainer.appendChild(conditionRow);
	});

	const addConditionButton = document.createElement('button');
	addConditionButton.type = 'button';
	addConditionButton.textContent = 'Add Condition';
	addConditionButton.onclick = () => {
		queryObject.steps[stepIndex].filtering.conditions.push({column:"", operator:"=", value:""});
		renderForm();
	};

	container.appendChild(conditionsContainer);
	container.appendChild(addConditionButton);
}

function renderAggregation(container, step, stepIndex) {
	const aggregationTitle = document.createElement('h3');
	aggregationTitle.textContent = 'Aggregation';
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
	orderByTitle.textContent = 'Order by';
	container.appendChild(orderByTitle);

	const orderByContainer = document.createElement('div');
	orderByContainer.className = 'repeatable-container';
	step.aggregation.order_by.forEach((orderByEntry, orderByIndex) => {
		const orderByRow = document.createElement('div');
		orderByRow.className = 'repeatable-row';
		const orderByColumnInput = document.createElement('input');
		orderByColumnInput.type = 'text';
		orderByColumnInput.placeholder = 'Column';
		orderByColumnInput.value = orderByEntry.column;
		orderByColumnInput.addEventListener('input', () => {
			queryObject.steps[stepIndex].aggregation.order_by[orderByIndex].column = orderByColumnInput.value;
		});

		const orderByDirectionSelect = document.createElement('select');
		
		const ascendingOption = document.createElement('option');
		ascendingOption.value = 'ASC';
		ascendingOption.textContent = 'ASC';
		const descendingOption = document.createElement('option');
		descendingOption.value = 'DESC';
		descendingOption.textContent = 'DESC';

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

		orderByRow.appendChild(orderByColumnInput);
		orderByRow.appendChild(orderByDirectionSelect);
		orderByRow.appendChild(removeOrderByButton);

		orderByContainer.appendChild(orderByRow);
	});

	const addOrderByButton = document.createElement('button');
	addOrderByButton.type = 'button';
	addOrderByButton.textContent = 'Add Order By';
	addOrderByButton.onclick = () => {
		qggueryObject.steps[stepIndex].aggregation.order_by.push({column:"", direction:"ASC"});
		renderForm();
	};

	container.appendChild(orderByContainer);
	container.appendChild(addOrderByButton);
}

function renderGroupBy(container, step, stepIndex) {
	const groupByTitle = document.createElement('h3');
	groupByTitle.textContent = 'Group by';
	container.appendChild(groupByTitle);

	const groupByContainer = document.createElement('div');
	groupByContainer.className = 'repeatable-container';
	step.aggregation.group_by.forEach((gbColumn, gbColumnIndex) => {
		const groupByRow = document.createElement('div');
		groupByRow.className = 'repeatable-row';
		const groupByInput = document.createElement('input');
		groupByInput.type = 'text';
		groupByInput.placeholder = 'Group By Column';
		groupByInput.value = gbColumn;
		groupByInput.addEventListener('input', () => {
			queryObject.steps[stepIndex].aggregation.group_by[gbColumnIndex] = groupByInput.value;	
		});

		const removeGroupByButton = document.createElement('button');
		removeGroupByButton.type = 'button';
		removeGroupByButton.textContent = '-';
		removeGroupByButton.onclick = () => {
			queryObject.steps[stepIndex].aggregation.group_by.splice(gbColumnIndex, 1);
			renderForm()
		}

		groupByRow.appendChild(groupByInput);
		groupByRow.appendChild(removeGroupByButton);
		groupByContainer.appendChild(groupByRow);
	});

	const addGroupByButton = document.createElement('button');
	addGroupByButton.type = 'button';
	addGroupByButton.textContent = 'Add Group By';
	addGroupByButton.onclick = () => {
			queryObject.steps[stepIndex].aggregation.group_by.push("");
			renderForm();
		};
		container.appendChild(groupByContainer);
		container.appendChild(addGroupByButton);
	}

	function renderColumns(container, step, stepIndex) {
		const columnsTitle = document.createElement('h3');
		columnsTitle.textContent = 'Columns';
		container.appendChild(columnsTitle);

		const columnsContainer = document.createElement('div');
		columnsContainer.className = 'repeatable-container';
		step.columns.forEach((column, columnIndex) => {
			const columnRow = document.createElement('div');
			columnRow.className = 'repeatable-container';
			const columnInput = document.createElement('input');
			columnInput.type = 'text';
			columnInput.placeholder = 'Column';
			columnInput.value = column;
			columnInput.addEventListener('input', () => {
				queryObject.steps[stepIndex].columns[columnIndex] = columnInput.value;	
			});

			const removeColumnButton = document.createElement('button');
			removeColumnButton.type = 'button';
			removeColumnButton.textContent = '-';
			removeColumnButton.onclick = () => {
				queryObject.steps[stepIndex].columns.splice(columnIndex, 1);
				renderForm();
			}

			columnRow.appendChild(columnInput);
			columnRow.appendChild(removeColumnButton);
			columnsContainer.appendChild(columnRow);
		});

		const addColumnButton = document.createElement('button');
		addColumnButton.type = 'button';
		addColumnButton.textContent = 'Add Column';
		addColumnButton.onclick = () => {
		queryObject.steps[stepIndex].columns.push("");
		renderForm();
	};

	container.appendChild(columnsContainer);
	container.appendChild(addColumnButton);
}

function renderTargetSection(container) {
	// Title
	const targetTitle = document.createElement('h2');
	targetTitle.textContent = "Target Database and Query Description";
	container.appendChild(targetTitle);

	// Target databases
	const targetDatabasesDiv = document.createElement('div');
	targetDatabasesDiv.className = 'targetDatabase(s)';
	const targetDatabaseTitle = document.createElement('h3');
	targetDatabaseTitle.textContent = 'Target Database';
	targetDatabasesDiv.appendChild(targetDatabaseTitle);

	const targetDatabasesContainer = document.createElement('div');
	targetDatabasesContainer.className = 'repeatable-container';

	queryObject.target_databases.forEach((database, databaseIndex) => {
		const row = document.createElement('div');
		row.className = 'repeatable-row';

		const input = document.createElement('input');
		input.type = 'text';
		input.value = database;
		input.placeholder = 'Target Database';
		input.addEventListener('input', () => {
			queryObject.target_databases[databaseIndex] = input.value;
		});

		const removeButton = document.createElement('button');
		removeButton.type = 'button';
		removeButton.textContent = '-';
		removeButton.onclick = () => {
			queryObject.target_databases.splice(databaseIndex, 1);
			renderForm();
		};

		row.appendChild(input);
		row.appendChild(removeButton);
		targetDatabasesContainer.appendChild(row);
	});

	const addButton = document.createElement('button');
	addButton.type = 'button';
	addButton.textContent = 'Add Target Database';
	addButton.onclick = () => {
		queryObject.target_databases.push("");
		renderForm();
	};
	targetDatabasesDiv.appendChild(targetDatabasesContainer)
	targetDatabasesDiv.appendChild(addButton);
	
	// Description
	const descriptionDiv = document.createElement('div');
	descriptionDiv.className = 'description';
	const descriptionLabel = document.createElement('labe');
	descriptionLabel.textContent = "Description";
	const descriptionInput = document.createElement('input');
	descriptionInput.type = 'text';
	descriptionInput.placeholder = 'Query Description';
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
	console.log(jsonString)
	queryObject = JSON.parse(jsonString);
	renderForm();
}

function displayResults(results) {
	
}

const generateButton = document.getElementById('generateButton');
generateButton.onclick = () => {
	const outputJsonField = document.getElementById('outputJSON');
	const jsonString = JSON.stringify(queryObject, null, 2);
	outputJsonField.value = jsonString;

	autoResizeTextarea(outputJsonField);
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
		const response = await fetch(serverURL, queryWrapped);
		if (!response.ok) {
			throw new Error(`HTTP Error! Status: ${response.status}`);
		}
		const responseData = await response.json();
		document.getElementById("responseJSON").textContent = JSON.stringify(responseData, null, 2);
	} catch (error) {
		document.getELementById("responseJSON").textContent = `Error ${error}`;

	}
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
		try {
			loadQuery(inputJSON);	
		} catch (e) {
			console.log(e);
			alert("Invalid JSON.");
		}
	} else {
		alert("Paste a JSON before loading.")
	}
};

document.addEventListener("DOMContentLoaded", () => {
	renderForm();
});
