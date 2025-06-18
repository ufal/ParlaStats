import { getTranslations } from '../translations.js'

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
const translations = getTranslations();


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

function augmentLabels(currentLanguage, key) {
	let res = "";
	let parts = key.split('_');
	Object.keys(translations).forEach(k => {
		if (parts[0] === k) { res += translations[parts[0]][currentLanguage]; }
		let rest = parts.slice(1);
		let col = `${rest[0]}.${rest.slice(1).join('_')}`;
		if (col === k) {
			res += ` ${translations[k][currentLanguage]}`;
		} 	
	});
	if (res === "") {
		res = key;
	}
	return res
}

function pivotChart(rows, labelKeys, currentLanguage, splitKeys = []) {
	const allKeys = Object.keys(rows[0] || {});
	const numericKeys = allKeys.filter(k => typeof(rows[0][k]) === 'number' && !labelKeys.includes(k));
	const catKeys = allKeys.filter(k => !labelKeys.includes(k) && typeof rows[0][k] !== 'number');
	const labels = [ ...new Map(
		rows.map(r => [
			labelKeys.map(k => {
				if (typeof(r[k]) === 'string') { 
					if (Object.keys(translations).includes(r[k])) {
						return translations[r[k]][currentLanguage];
					}
					return r[k].replaceAll('_', ' ')
				} 
				else { return String(r[k]);}
			}).join('|'),
		    labelKeys.map(k => {
				if (typeof(r[k]) === 'string') {
					if (Object.keys(translations).includes(r[k])) {
						return translations[r[k]][currentLanguage];
					}
					return r[k].replaceAll('_', ' ')
				}
				else {return String(r[k]);} 
			})])
	).values()];
	const splitKey = splitKeys.length ? '_join_' : allKeys.find(k => !labelKeys.includes(k) && isNaN(+rows[0][k]))
	const withDerived = splitKeys.length 
		? rows.map(r => ({ ...r,
		                  ['_join_']: splitKeys.map(k => r[k]).join(' ') }))
		: rows;


	let datasets = [];
	let i = 0;
	const splitVals = [... new Set(withDerived.map(r => r[splitKey]))]
	splitVals.forEach((splitVal, iSplit) => {
		numericKeys.forEach((numKey, iNum) => {
			let l = splitVal ? `${splitVal} - ${augmentLabels(currentLanguage, numKey)}`
			             : `${augmentLabels(currentLanguage, numKey)}`;
			datasets.push({
				label: l,
				yAxisID : `y_${iNum}`,
				data: labels.map(tuple => {
					const row = withDerived.find(r => 
						labelKeys.every((k, i) => r[k] == tuple[i]) &&
						(splitKey ? r[splitKey] === splitVal : true)
					);
					return row ? + row[numKey] : null;
				}),
				
				backgroundColor: columnsColorHash(`${splitVal} - ${numKey}`),
				borderColor:     columnsColorHash(`${splitVal} - ${numKey}`)
			});
		});
	});
	return {labels, datasets };
}

export function visualizeAsGraph(responseData, queryObject, type, currentLanguage) {
	const targetElement = document.getElementById('results-graph-wrapper');
	targetElement.innerHTML = "";
	if (responseData.length === 0) {
		const message = document.createElement('h5');
		message.textContent = 'Nothing to visualize';
		targetElement.appendChild(message);
		return;
	}
	responseData.forEach(({database, data}) => {
		if (!Array.isArray(data) || !data.length) return;
		const graphDiv = document.createElement('div');
		const dbHeader = document.createElement('h5');
		dbHeader.textContent = `${database} - ${queryObject.description}`;
		graphDiv.appendChild(dbHeader);
		graphDiv.classList.add('graph-div');
		
		const labelColumns = getLabels(queryObject);
		let name = [];
		if (Object.keys(data[0]).includes('persname.forename') &&
		    Object.keys(data[0]).includes('persname.surname')) {
			name.push('persname.forename');
			name.push('persname.surname');
		}
		const canvas = document.createElement('canvas');
		graphDiv.appendChild(canvas);
		const graphContents = pivotChart(data, labelColumns, currentLanguage, name);
		
		var d = graphContents;
		var datasets=d.datasets;
		const scales = {};
		datasets.forEach(dataset => {
			const axisId = dataset.yAxisID;
			const color = dataset.backgroundColor;
			console.log(axisId);
			const n = +axisId.split('_')[1] || 0;
			scales[axisId] = {
				position: yAxisPositions[n % 2],
				ticks: { color: color },
				border: { color: color },
				grid: { color: Chart.helpers
							   .color(color)
					           .alpha(0.15)
					           .rgbString() }
			}
		});
		
		new Chart(canvas, {
			type:type,
			data: graphContents,
			options: {
				plugins: { zoom },
				responsive: true,
				interaction:{mode:'index', intersect:false},
				scales: {
					...scales
				}
			}
		});
		
		targetElement.appendChild(graphDiv);
	});

}

function getLabels2(queryObject) {
	let labels = [];
	const lastStep = queryObject.steps[queryObject.steps.length - 1];
	const groupBySection = lastStep.aggregation.group_by;
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
			if (entry.includes('step_result')) {
				const split_entry = entry.split('/');
				labels.push(split_entry[split_entry.length-1]);
			} else {
				labels.push(entry);
			}
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

function determineLabels(data, queryObject, currentLanguage) {
	const last_step = queryObject.steps[queryObject.steps.length - 1];
	const columns = last_step.columns;
	const group_by = last_step.aggregation.group_by;
	const columns_parsed = columns.map(col => {
		if (typeof(col) === 'object') {
			if (col.alias != "") {
				return col.alias;
			} else {
				return `${col.agg_func.toLowerCase()}_${col.real.replace('.', '_')}`
			}
		} else if (col.includes('.')) {
			return col.split('.')[1];
		} else if (col.includes('step_result')) {
			const parts = col.split('/');
			return parts[parts.length - 1]
		} else {
			return col
		}
	});
	const group_by_cols_parsed = group_by.map(col => {
		if (typeof(col) === 'object') {
			if (col.agg_func != "") {
				return `${col.agg_func.toLowerCase()}_${col.real.replace('.', '_')}`
			} else {
				return col.real.split('.')[1];
			}
		} else if (col.includes('.')) {
			return col.split('.')[1];
		} else if (col.includes('step_result')) {
			const parts = col.split('/');
			return parts[parts.length - 1]
		} else {
			return col;
		}
	});
	
	const label_columns = columns_parsed.filter(col => { 
		if (group_by_cols_parsed.includes(col)) {
			return col.toLowerCase;
		}
	});
	const labels = data.map(row => {
		return Object.entries(row)
			.filter(([key, val]) => label_columns.includes(key.toLowerCase()) && isNaN(val))
			.map(([_, val]) => val)
			.join('-')
	});
	return labels

}

