const zoom = {
	pan: {
		enabled: true,
		mode : 'x',
	},
	zoom: {
		wheel : { enabled:true },
		pinch : { enabled:true },
		drag : {enabled:true, borderColor:'#009688' },
		mode : 'x',
		
	},
	limits: {
		x : { minRange: 5 }	
	}
};

export function visualizeAsGraph(responseData, queryObject, type) {
	const targetElement = document.getElementById('results-graph-wrapper');
	targetElement.innerHTML = "";
	responseData.forEach(({database, data}) => {
		
		if (!Array.isArray(data) || !data.length) return;
		
		const graphDiv = document.createElement('div');
		const dbHeader = document.createElement('h5');
		dbHeader.textContent = `${database}`;
		graphDiv.appendChild(dbHeader);
		graphDiv.classList.add('graph-div');
		
		
		
		const labelColumns = getLabels(queryObject);
		labelColumns.forEach(labelColumn => {
			const canvas = document.createElement('canvas');
			graphDiv.appendChild(canvas);
			
			const labels = data.map(r => String(r[labelColumn] ?? ''));

			const valueColumns = Object.keys(data[0]).filter(column => column !== labelColumn);
		
			const datasets = valueColumns.map(col => ({
				label : col,
				data : data.map(r => +r[col]),
				borderWidth : 2,
				backroundColor: `hsla(${Math.random()*360}, 70%,60%,.4)`,
				borderColor: `hsla(${Math.random()*360},70%, 40%, 1)` 
			}));
			console.log(labels);
			new Chart(canvas, {
				type:type,
				data: {labels, datasets },
				options: {
					plugins: { zoom },
					responsive:true, 
					interaction:{mode:'index', intersect:false} 
				}
			});
		});
		
		
		targetElement.appendChild(graphDiv);
	});

}

function getLabels(queryObject) {
	const lastStep = queryObject.steps[queryObject.steps.length -1];
	const columnSection = lastStep.columns;
	const groupBySection = lastStep.aggregation.group_by;
	let labels = [];
	columnSection.forEach(entry => {
		if (groupBySection.includes(entry)) {
			labels.push(entry);
		}
	});
	console.log(labels);
	return labels;
}

export function bindButtons(responseData, queryObject) {
	const barButton = document.getElementById('bar-button');
	barButton.onclick = () => {
		visualizeAsGraph(responseData, queryObject, 'bar');
	};

	const lineButton = document.getElementById('line-button');
	lineButton.onclick =() => {
		visualizeAsGraph(responseData, queryObject, 'line');
	};

}
