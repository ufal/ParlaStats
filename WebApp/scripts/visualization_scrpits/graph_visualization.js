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

const colorCache = new Map();
const yAxisPositions = ['left', 'right'];

function columnsColorHash(str) {
	if (colorCache.has(str)) { return colorCache.get(str) }
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash<<5) + hash + str.charCodeAt(i);
	}
	const hue = Math.abs(hash) % 360;

	const hsl = `hsl(${hue},70%,40%)`;
	colorCache.set(str, hsl);
	return hsl;
}

function pivotChart(rows, labelKeys) {
	const allKeys = Object.keys(rows[0] || {});
	const numericKeys = allKeys.filter(k => typeof(rows[0][k]) === 'number');
	const catKeys = allKeys.filter(k => !labelKeys.includes(k) && typeof rows[0][k] !== 'number');
	console.log(numericKeys);
	const labels = [ ...new Map(
		rows.map(r => [labelKeys.map(k => r[k].replaceAll('_', ' ')).join('|'),
		               labelKeys.map(k => r[k].replaceAll('_', ' '))])
	).values()];
	let datasets = [];
	const find = (pred, key) => (rows.find(pred) || {}) ?? null;
	if (labelKeys.length === 1 && catKeys.length) {
		/* ========== NEW: handle many numeric keys ========== */
		const seriesKey   = catKeys[0];                 // e.g. 'year'
		const seriesVals  = [...new Set(rows.map(r => r[seriesKey]))];

			
		datasets = seriesVals.map((val , i) => ({
			label: String(val),
			data: labels.map(([lab]) => 
					(rows.find(r => r[labelKeys[0]] == lab &&
					                r[seriesKey] == val) || {})[numericKeys[0].replaceAll(' ', '_')] ?? null),
			yAxisID:`y_${i}`,
			backgroundColor: columnsColorHash(String(val))
		}));
	} else {
		datasets = numericKeys.map((key, i) => ({
			label: key.replaceAll('_', ' '),
			data: labels.map(tuple => 
						(rows.find(r => labelKeys.every((k,idx) => r[k] === tuple[idx])) || {})[key] ?? null),
			backgroundColor: columnsColorHash(key),
			yAxisID:`y_${i}`
		}));
	}
	// console.log(datasets);
	return {labels, datasets: datasets };
}

export function visualizeAsGraph(responseData, queryObject, type) {
	const targetElement = document.getElementById('results-graph-wrapper');
	targetElement.innerHTML = "";
	responseData.forEach(({database, data}) => {
		
		if (!Array.isArray(data) || !data.length) return;
		// console.log(data);
		const graphDiv = document.createElement('div');
		const dbHeader = document.createElement('h5');
		dbHeader.textContent = `${database}`;
		graphDiv.appendChild(dbHeader);
		graphDiv.classList.add('graph-div');
		
		const labelColumns = getLabels(queryObject);
		const canvas = document.createElement('canvas');
		graphDiv.appendChild(canvas);
		const graphContents = pivotChart(data, labelColumns);
		
		var d = pivotChart(data, labelColumns);
		var datasets=d.datasets;
		var scales = {};
		let i = 0;
		datasets.forEach(dataset => {
			scales['y_'+ i++] = {
				position:yAxisPositions[i%2],
				ticks: {
					color:dataset.backgorundColor
				}
			};
		});

		new Chart(canvas, {
			type:type,
			data: pivotChart(data, labelColumns),
			options: {
				plugins: { zoom },
				responsive: true,
				interaction:{mode:'index', intersect:false},
				scales: {
					...scales
				}
			}
		});
		// labelColumns.forEach(labelColumn => {
		// 	const canvas = document.createElement('canvas');
		// 	graphDiv.appendChild(canvas);
			
		// 	const labels = data.map(r => labelColumns.map(c => r[c]));

		// 	const valueColumns = Object.keys(data[0]).filter(column => !labelColumns.includes(column));
		// 	var scales = {};
			
		// 	let i=0;
		// 	const datasets = valueColumns.map(col => ({
		// 		label : col,
		// 		data : data.map(r => +r[col]),
		// 		borderWidth : 1,
		// 		backgroundColor: columnsColorHash(col),
		// 		borderColor: columnsColorHash(col),
		// 		yAxisID:'y_'+ i++
		// 	}));
		// 	i = 0;
		// 	datasets.forEach(dataset => {
		// 		scales['y_'+ i++] = {
		// 			position:yAxisPositions[i%2],
		// 			ticks: {
		// 				color:dataset.backgroundColor
		// 			}
		// 		};
		// 	});
			
			
		// 	new Chart(canvas, {
		// 		type:type,
		// 		data: {labels, datasets },
		// 		options: {
		// 			plugins: { zoom },
		// 			responsive:true, 
		// 			interaction:{mode:'index', intersect:false} 
		// 		},
		// 		scales: {
		// 			...scales
		// 		}
		// 	});
		// });
		
		
		targetElement.appendChild(graphDiv);
	});

}

function getLabels2(queryObject) {
	let labels = [];
	const lastStep = queryObject.steps[queryObject.steps.length - 1];
	const groupBySection = lastStep.aggregation.group_by;
	console.log(groupBySection);
	groupBySection.forEach(entry => {
		labels.push(entry);
	});
	return labels
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
