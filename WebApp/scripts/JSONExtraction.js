function collectFromForm() {
	// Go throught the structure of the document and extract filled information from form
	// Also filters out from the final query fields that are present in the form
	// i.e the HTML code is generated, but input fields are empty.

	// Get target databases
	
	const targetDatabaseFields = document.querySelectorAll('.targetDatabase .repeatable-container .repeatable-row input[type="text"]');
	const targetDatabases = Array.from(targetDatabaseFields)
		.map(input => input.value.trim())
		.filter(val => val !== '');

	
	// Get Description
	const descriptionField = document.getElementById('description');
	const description = descriptionField ? descriptionField.value.trim() : '';

	// Get steps
	const stepsRows = document.querySelectorAll('.steps .repeatable-container > .repeatable-row');
	const steps = Array.from(stepsRows).map(stepRow => {
		
		// Get the goal of the step
		const goalField = stepRow.querySelector('[class^="goal_steps_"] input');
		const stepGoal = goalField ? goalField.value.trim() : '';
	
		// Columns
		const columnsContainer = stepRow.querySelector('[class^="columns_steps_"] .repeatable-container');
		const columnFields = columnsContainer ? columnsContainer.querySelectorAll('.repeatable-row input[type="text"]') : [];
		const columns = Array.from(columnFields)
			.map(cf => cf.value.trim())
			.filter(val => val !== '');

		// Get group-by's columns
		const groupByContainer = stepRow.querySelector('[class^="aggregation_steps_"] .group-by .repeatable-container');
		const groupByFields = groupByContainer ? groupByContainer.querySelectorAll('.repeatable-row input[type="text"]') : [];
		const groupBy = Array.from(groupByFields)
			.map(groupByField => groupByField.value.trim())
			.filter(val => val !== '');

		// Get order-by's objects
		const orderByContainer = stepRow.querySelector('[class^="aggregation_steps_"] .order-by .repeatable-container');
		const orderByRows = orderByContainer ? orderByContainer.querySelectorAll('.repeatable-row') : [];
		const orderByObjects = Array.from(orderByRows).map(row => {
			const columnField = row.querySelector('input[type="text"]');
			const directionField = row.querySelector('select');
			const column = columnField ? columnField.value.trim() : '';
			const direction = directionField ? directionField.value.trim() : '';
			return (column && direction) ? {column, direction} : null;
		}).filter(object => object !== null);

		// Get Conditions
		const conditionsContainer = stepRow.querySelector('[class^="filtering_steps_"] .conditions .repeatable-container');
		const conditionsRows = conditionsContainer ? conditionsContainer.querySelectorAll('.repeatable-row') : [];
		const conditionsObjects = Array.from(conditionsRows).map(row => {
			const textFields = row.querySelectorAll('input[type="text"]');
			const condColumnField = textFields [0] || null;
			const valueField =  textFields [1] || null;
			const operatorField = row.querySelector('select');
		 
			const column = condColumnField ? condColumnField.value.trim() : '';
			const operator = operatorField ? operatorField.value.trim() : '';
			const value = valueField ? valueField.value.trim(): '';

			return (column && operator && value) ? { column, operator, value } : null;
		}).filter(condition => condition !== null);

		// Get limit
		const limitField = stepRow.querySelector('[class^="limit_steps_"] input[type="number"]');
		const limitVal = limitField && limitField.value !== '' ? parseInt(limitField.value, 10): undefined;
		const limit = isNaN(limitVal) ? undefined : limitVal;

		// Finally build the entire step
		const stepObject = {
			goal: stepGoal,
			columns: columns,
			aggregation: {
				groupBy: groupBy,
				orderBy: orderByObjects
			},
			filtering: {
				conditions: conditionsObjects
			},
			limit: limit
		};

		// Get rid of empty steps (these are for some unknown (yet) reason generated alongside
		// valid steps)
		const isEmptyStep = !stepGoal && columns.length === 0 && groupBy.length === 0 &&
							orderByObjects.length === 0 && conditionsObjects.length === 0 &&
							typeof limit === 'undefined';

		return isEmptyStep ? null : stepObject;
	}).filter(stepObject => stepObject !== null);

	const queryObject = {
		targetDatabases,
		description,
		steps
	};

	return queryObject;
}
