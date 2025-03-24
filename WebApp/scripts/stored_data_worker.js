export function storeAliases(jsonQuery, aliases, stepIndex) {
	aliases[stepIndex] = [];
	const targetStep = jsonQuery.steps[stepIndex];
	const columns = targetStep.columns;
	columns.forEach(column => {
		console.log(column);
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
			stepResult = "step_result/"+ stepName + "/" + column.alias;
		} else if (typeof column === 'string') {
			stepResult = "step_result/" + stepName + "/" + column;
		}
		stepResultsArray[stepIndex].push(stepResult);
	});
}

export function updateColumnsOfferings2(userDefinedAliases, stepResultsArray, stepsCount) {
	for (var index = 0; index < stepsCount; index++) {
		let columnOfferings = document.querySelectorAll(`.column-offering-${index}`);
		columnOfferings.forEach(columnSelect => {
			const options = columnSelect.querySelectorAll('option.user-specific');
			options.forEach(option => option.remove());

			let aliases = userDefinedAliases[index];
			aliases.forEach(alias => {
				const selectOption = document.createElement('option');
				selectOption.className = "user-specific";
				selectOption.value = alias;
				selectOption.textContent = alias;
				columnSelect.appendChild(selectOption);
			});

			for (var i = 0; i < index; i++) {
				stepResultsArray[i].forEach(stepResult => {
					 const selectOption = document.createElement('option');
					selectOption.className = "user-specific";
					selectOption.value = stepResult;
					selectOption.textContent = stepResult;
					columnSelect.appendChild(selectOption);
				});
			}
		});
	}
}


