// Picked a more complex example
const json_file_path = "average_named_entity_references_by_ANO_members.json"

// Load JSON
function load_JSON() {
	fetch(json_file_path)
		.then((response) => { return response.json(); })
		.then((data) => { fill_form(data); })
		.catch((error) => {console.error("Error loading JSON:", error); } );
}

// Fill out the form
function fill_form(data) {

	document.getElementById("targetDatabase").value = data.target_databases.join(", ");
	document.getElementById("description").value = data.description;

	const stepSection = document.getElementById("stepsSection");
	stepSection.innerHTML="";


	data.steps.forEach((step, index) => {
		
		// Step
		const stepContainer = document.createElement("div");
		stepContainer.classList.add("step");
		
		const goalDiv = document.createElement("div");
		goalDiv.classList.add("goal");
		goalDiv.innerHTML = `<h2>${index + 1}: ${step.goal}</h2>`;
		
		stepContainer.appendChild(goalDiv);

		// Columns
		const columnSection = document.createElement("div");
		columnSection.classList.add("columns");
		columnSection.innerHTML = `<h3>Columns</h3>`;
		
		step.columns.forEach((column) => {
			const columnDiv = document.createElement("div");
			columnDiv.classList.add("columns-entry");
			columnDiv.textContent = column;
			columnSection.appendChild(columnDiv);
		});
		stepContainer.appendChild(columnSection);
		
		// Aggregation section
		const aggregationSection = document.createElement("div");
		aggregationSection.classList.add("aggregation")
		aggregationSection.innerHTML = `<h3>Aggregation</h3>`;
		
		// Group By
		const groupBySection = document.createElement("div");
		groupBySection.classList.add("group-by");
		groupBySection.innerHTML = `<h4>Group By</h4>`;	

		step.aggregation.group_by.forEach((groupBy) => {
			const groupByDiv = document.createElement("div");
			groupByDiv.classList.add("group-by-entry");
			groupByDiv.textContent = groupBy;
			groupBySection.appendChild(groupByDiv);
		});
		aggregationSection.appendChild(groupBySection);

		// Order By
		const orderBySection = document.createElement("div");
		orderBySection.classList.add("order-by");
		orderBySection.innerHTML=`<h4>Order By</h4>`;

		step.aggregation.order_by.forEach((orderBy) => {
			const orderByDiv = document.createElement("div");
			orderByDiv.classList.add("order-by-entry");
			orderByDiv.textContent = `${orderBy.column} ${orderBy.direction}` || "None";
			orderBySection.appendChild(orderByDiv);
		});
		aggregationSection.appendChild(orderBySection);

		stepContainer.appendChild(aggregationSection);

		// Filtering
		const filteringSection = document.createElement("div");
		filteringSection.classList.add("filtering");
		filteringSection.innerHTML = `<h3>Filtering</h3>`;

		// Conditions
		const conditionSection = document.createElement("div");
		conditionSection.classList.add("conditions")
		conditionSection.innerHTML = `<h4>Conditions</h4>`
		
		step.filtering.conditions.forEach((condition) => {
			const conditionDiv = document.createElement("div");
			conditionDiv.classList.add("conditions-entry");
			conditionDiv.textContent = `${condition.column} ${condition.operator} ${condition.value}`;
			conditionSection.appendChild(conditionDiv);
		});
		filteringSection.appendChild(conditionSection);

		stepContainer.appendChild(filteringSection);

		// Limit
		const limitSection = document.createElement("div");
		limitSection.innerHTML = `<h4>Limit</h4>`;
		limitSection.classList.add("limit");
		const limitDiv = document.createElement("div");
		limitDiv.textContent= step.limit || "None";

		limitSection.appendChild(limitDiv);

		stepContainer.appendChild(limitSection);

		stepSection.appendChild(stepContainer);
	
	});
}

document.addEventListener("DOMContentLoaded", load_JSON);
