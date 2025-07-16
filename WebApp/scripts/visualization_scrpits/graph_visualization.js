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
	/* Hash function for assigining a specific color to each data label,
	 * ensuring color distinction between bards of the graph
	 * The ahshing function has been inspired by this stack overflow post:
	 * https://stackoverflow.com/questions/30808980/c-making-hash-function-for-int-triples
	 * */
	if (colorCache.has(str)) { return colorCache.get(str) }
	let hash = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash = (hash >>> 0) + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24));
	}
	hash >>>= 0;
	const hue = hash % 360;
	const saturation = 60 + ((hash >> 9) % 30);
	const lightness = 40 + ((hash >> 19) % 20);

	const hsl = `hsl(${hue},${saturation}%,${lightness}%)`;
	colorCache.set(str, hsl);

	return hsl;
}

function augmentLabels(currentLanguage, key) {
	/* Little helper for better visualizing of labels*/
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
	/* function that prepares the labels and datasets for the graph
	 * transforms raw tabular data into datasets compatible with charts.js grpahs
	 * */
	const allKeys = Object.keys(rows[0] || {});
	const numericKeys = allKeys.filter(k => typeof(rows[0][k]) === 'number' && !labelKeys.includes(k)); // values
	const catKeys = allKeys.filter(k => !labelKeys.includes(k) && typeof rows[0][k] !== 'number'); // will become part of data description
	// create labels - a map where key is all the label keys joint with '|' and value is the array of those label keys
	// the array is then used to match data rows.
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
	// in case the label should be composed of multiple keys concatenate those keys to a singular label
	// i.e. speaker forename + surname
	const splitKey = splitKeys.length ? '_join_' : allKeys.find(k => !labelKeys.includes(k) && isNaN(+rows[0][k]))
	const withDerived = splitKeys.length 
		? rows.map(r => ({ ...r,
		                  ['_join_']: splitKeys.map(k => r[k]).join(' ') }))
		: rows;


	let datasets = [];
	let i = 0;
	// determine series in the chart
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
	/* Function for visualizing query results as graph
	 *
	 * */
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


function getLabels(queryObject) {
	/* Function that decides vlaues of which columns are to be used as x-axis labels
	 * Current logic is: Column is an x-axis label if it is selected both in
	 * group by and columns secton of the JSON query
	 * */
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
	/*Chart type options */
	const barButton = document.getElementById('bar-button');
	barButton.onclick = () => {
		visualizeAsGraph(responseData, queryObject, 'bar');
	};

	const lineButton = document.getElementById('line-button');
	lineButton.onclick =() => {
		visualizeAsGraph(responseData, queryObject, 'line');
	};
}



