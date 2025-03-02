export function storeAliases(jsonQuery, aliases, stepIndex) {
	console.log(jsonQuery);
	console.log(aliases);
	aliases[stepIndex] = [];
	const targetStep = jsonQuery.steps[stepIndex];
	const columns = targetStep.columns;
	columns.forEach(column => {
		if (typeof column === 'object') {
			if (column.alias && !aliases[stepIndex].includes(column.alias)) {
				aliases[stepIndex].push(column.alias);
			}
		}
	});
}

export function storeStepResults(jsonQuery, stepResultsArray, stepIndex) {
	stepResultsArray[stepIndex] = [];
	const targetStep = jsonQuery.steps[stepIndex];
	const stepName = targetStep.goal;
	const columns = targetStep.columns;
	columns.forEach(column => {
		let stepResult = "";
		if (typeof column === 'object') {
			stepResult = "step_result."+ stepName + "." + column.alias;
		} else if (typeof column === 'string') {
			stepResult = "step_result." + stepName + "." + column;
		}
		stepResultsArray[stepIndex].push(stepResult);
	});
}
