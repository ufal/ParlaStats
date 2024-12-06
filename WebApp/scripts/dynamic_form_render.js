function renderForm(schema) {
	// Render the form based on JSON structure description.
	// Basically, the form sections are divided into 3 categories:
	// 
	//	SIMPLE
	//	-> The field / section which contains only input fields of
	//	   some sort and do not contain any subfileds (i.e Goal section of the step)
	//
	//	COMPLEX
	//	-> The field / section which can contain subfields or subsections
	//	   of some sort, i.e Aggregation (has subsections group by and order by)
	//
	//	REPEATABLE
	//	-> Both SIMPLE and COMPLEX sections / fields can be repeatable, if 
	//	   it makes sense to have multiple instance of them rendered (step, group-by columns etc.)
	//
	//	This fucntion reads the JSON structure specification and renders individual fields
	//	based on it.
	//
	//	Calls special functions for generating each of the above described types of
	//	sections.
    const form = document.getElementById("dynamicForm");

    schema.form.sections.forEach((section) => {
        const sectionDiv = document.createElement("div");
        sectionDiv.classList.add("form-section");
        sectionDiv.id = section.id;

        const sectionTitle = document.createElement("h2");
        sectionTitle.textContent = section.title;
        sectionDiv.appendChild(sectionTitle);

        switch (section.type) {
            case "REPEATABLE":
                renderRepeatableField(sectionDiv, section);
                break;
            case "SIMPLE":
                renderSimpleField(sectionDiv, section);
                break;
            case "COMPLEX":
                renderComplexField(sectionDiv, section);
                break;
        }

        form.appendChild(sectionDiv);
    });
	
	const generateQueryButton = document.createElement("button");
	generateQueryButton.textContent = "Generate JSON";
	generateQueryButton.type="button";
	generateQueryButton.onclick = () => {
		const query = generateQueryFromForm(schema);
		console.log("Generated Query:", JSON.stringify(query, null, 2));
	};

	form.appendChild(generateQueryButton)
}

function renderSimpleField(container, field) {
	// Function for rendering SIMPLE field / section.
    const fieldDiv = document.createElement("div");
    fieldDiv.classList.add(field.id)
	const label = document.createElement("label");
    label.textContent = field.label;
    label.setAttribute("for", field.id);

    const input = document.createElement(field.inputType === "select" ? "select" : "input");
    if (field.inputType === "select") {
        field.choices.forEach((choice) => {
            const option = document.createElement("option");
            option.value = choice;
            option.textContent = choice;
            input.appendChild(option);
        });
    } else {
        input.type = field.inputType;
        input.placeholder = field.placeholder || "";
        if (field.readonly) {
            input.setAttribute("readonly", true);
        }
    }
    input.id = field.id;

    fieldDiv.appendChild(label);
    fieldDiv.appendChild(input);
    container.appendChild(fieldDiv);
}

function renderRepeatableField(container, field) {
	// Function for rendering REPEATABLE field / section.
	let subfieldsCount = 0;
    const fieldDiv = document.createElement("div");
	fieldDiv.classList.add(field.id);
    const label = document.createElement("h3");
    label.textContent = field.label;
	fieldDiv.appendChild(label);

    const addButton = document.createElement("button");
    addButton.textContent = `Add ${field.label}`;
    addButton.type = "button";

    const repeatableContainer = document.createElement("div");
    repeatableContainer.classList.add("repeatable-container");

    addButton.onclick = () => {
		const rowDiv = document.createElement("div");
		rowDiv.classList.add("repeatable-row");

		if (field.fields) {
			// If it's a REPEATABLE section with nested fields
			field.fields.forEach((nestedField) => {
				const uniqueId = `${nestedField.id}_${field.id}_${subfieldsCount}`;
				nestedField.id = uniqueId; // Ensure unique ID
				renderField(rowDiv, nestedField); // Use a common function for rendering
			});
		} else if (field.columns) {
			// Render REPEATABLE rows with multiple columns
			field.columns.forEach((column, index) => {
				const input = document.createElement(column.inputType === "select" ? "select" : "input");
				if (column.inputType === "select") {
					column.choices.forEach((choice) => {
						const option = document.createElement("option");
						option.value = choice;
						option.textContent = choice;
						input.appendChild(option);
					});
				} else {
					input.type = column.inputType;
					input.placeholder = column.label;
				}
				const uniqueId = `${field.id}_col_${index}_${subfieldsCount}`;
				input.id = uniqueId; // Ensure unique ID
				input.dataset.fieldId = field.id; // Use data attribute to group related inputs
				rowDiv.appendChild(input);
			});
		} else {
			// Render a simple REPEATABLE field
			const input = document.createElement("input");
			input.type = field.inputType;
			input.placeholder = field.placeholder || "";
			const uniqueId = `${field.id}_${subfieldsCount}`;
			input.id = uniqueId; // Ensure unique ID
			rowDiv.appendChild(input);
		}

		const removeButton = document.createElement("button");
		removeButton.textContent = "-";
		removeButton.type = "button";
		removeButton.onclick = () => rowDiv.remove();

		rowDiv.appendChild(removeButton);
		repeatableContainer.appendChild(rowDiv);
		subfieldsCount++;
	};

    // fieldDiv.appendChild(label);
    fieldDiv.appendChild(repeatableContainer);
    fieldDiv.appendChild(addButton);
    container.appendChild(fieldDiv);
}

function renderComplexField(container, field) {
	// Function for rendering COMPLEX fields / sections
    const complexDiv = document.createElement("div");
	complexDiv.classList.add(field.id)
    const label = document.createElement("h3");
    label.textContent = field.label;
	complexDiv.appendChild(label);

    field.subfields.forEach((subfield) => {
        switch (subfield.type) {
            case "SIMPLE":
                renderSimpleField(complexDiv, subfield);
                break;
            case "REPEATABLE":
                renderRepeatableField(complexDiv, subfield);
                break;
        }
    });

    
    container.appendChild(complexDiv);
}

function renderField(container, field) {
    switch (field.type) {
        case "SIMPLE":
            renderSimpleField(container, field);
            break;
        case "REPEATABLE":
            renderRepeatableField(container, field);
            break;
        case "COMPLEX":
            renderComplexField(container, field);
            break;
        default:
            console.warn(`Unknown field type: ${field.type}`);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetch("form_structure.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Failed to load form schema: ${response.status}`);
            }
            return response.json();
        })
        .then((schema) => {
            renderForm(schema);
        })
        .catch((error) => {
            console.error("Error rendering form:", error);
        });
});

