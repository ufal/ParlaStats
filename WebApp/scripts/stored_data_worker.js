export function storeAliases(jsonQuery, aliases, stepIndex) {
	aliases[stepIndex] = [];
	const targetStep = jsonQuery.steps[stepIndex];
	const columns = targetStep.columns;
	columns.forEach(column => {
		console.log(column);
		if (typeof column === 'object') {
			console.log("object detected");
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

export function updateColumnsOfferings(userDefinedAliases, stepResultsArray, stepIndex) {
	let columnOfferings = document.querySelectorAll(".column-offering");
	columnOfferings.forEach(columnSelect => {
		let currentOptions = Array.from(columnSelect.options)
		currentOptions = currentOptions.filter(option => option.className === "user-specific");
		currentOptions = currentOptions.map(option => option.value);
		
		
		let newAliasses = userDefinedAliases.filter(value => !currentOptions.includes(value));
		
		let newStepResults = []
		let index = 0;
		stepResultsArray.forEach(step => {
			if (index < stepIndex) {
				let temp = step.filter(value => !currentOptions.includes(value));
				temp.forEach(item => {newStepResults.push(item)});
				index++;
			}
		});
		// let newStepResults = stepResultsArray[stepIndex].filter(value => !currentOptions.includes(value));
		
		
		let redundantOptions = currentOptions.filter(value => !userDefinedAliases.includes(value));
		
		
		index = 0;
		stepResultsArray.forEach(step => {
			console.log(step);
			if (index < stepIndex) {
				redundantOptions = redundantOptions.filter(value => !step.includes(value));
			}
			index++;
		});
		// console.log(redundantOptions);
		// console.log(newAliasses);
		// console.log(newStepResults);
		// Remove redundant options
		for (let option of columnSelect.options) {
			if (redundantOptions.includes(option.value)) {
				columnSelect.remove(option.index);
			}
		}
		// Add new options
		newAliasses.forEach(alias => {
			const columnOption = document.createElement('option');
			columnOption.className = "user-specific";
			columnOption.value = alias;
			columnOption.textContent = alias;
			columnSelect.appendChild(columnOption);
		});
		index = 0;
		stepResultsArray.forEach(step => {
			if (index < stepIndex) {
				newStepResults.forEach(stepResult => {
					const columnOption = document.createElement('option');
					columnOption.className = "user-specific";
					columnOption.value = stepResult;
					columnOption.textContent = stepResult;
					columnSelect.appendChild(columnOption);
				});
				index++;
			}
		});
		
		

	});
}
