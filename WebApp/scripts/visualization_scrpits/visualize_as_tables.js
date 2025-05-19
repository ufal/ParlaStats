import {getTranslations} from '../translations.js'

const translations = getTranslations();

export function visualizeAsTable(response, currentLanguage) {
	const targetElement = document.getElementById('results-table-wrapper')
	targetElement.innerHTML = "";
	if (response.length === 0) {
		const message = document.createElement('h5');
		message.textContent = "Nothing to show";
		targetElement.appendChild(message);
		return;
	}
	response.forEach(({ database, data}) => {
		
		if (!Array.isArray(data) || !data.length) return;

		const tableDiv = document.createElement('div');
		const dbHeader = document.createElement('h5');
		dbHeader.textContent = `${database}`;
		tableDiv.appendChild(dbHeader);
		tableDiv.classList.add(`table-div`);
		
		const tableElement = document.createElement('table');
		tableElement.id = `table-${database}`;
		tableElement.classList.add('display');
		tableElement.classList.add('striped');
		tableElement.style="width:100%";
		tableDiv.appendChild(tableElement);

		const dataa = [
			{col1: 'val1', col2:'val2' },
			{col1: 'val3', col2:'val2' }
		]

		const columns = Object.keys(data[0]).map(c => ({
			data: c.includes('.') ? c.replace(/\./g, '\\.') : c, 
			title: Object.keys(translations).includes(c) ? translations[c][currentLanguage] : c.replaceAll('_', ' ')
		}));
		console.log(`Columns: ${columns}.`)
		console.log(columns[0]);
		new DataTable(tableElement, { 
			data, 
			columns, 
			responsive:true, 
			pageLength:10, 
			lengthMenu: [5, 10, 25, 50, 100],
			layout: { topStart: 'buttons' },
			buttons: {
				dom: {
					button: { className: 'btn waves-effect waves-light' }
				},
				buttons: [
					{
						extend:'csv',
						text: 'Export as CSV'
					}
				]
			}
		});

		targetElement.appendChild(tableDiv);
	});
}
	
