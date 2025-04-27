export function visualizeAsTable(response) {
	const targetElement = document.getElementById('results-table-wrapper')
	console.log(response);
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
		tableElement.style="width:100%";
		tableDiv.appendChild(tableElement);

		const dataa = [
			{col1: 'val1', col2:'val2' },
			{col1: 'val3', col2:'val2' }
		]

		const columns = Object.keys(data[0]).map(c => ({
			data: c.includes('.') ? c.replace(/\./g, '\\.') : c, 
			titile: c
		}));
		
		console.log(columns);
		console.log(data);
	
		new DataTable(tableElement, { 
			data, 
			columns, 
			responsive:true, 
			pageLength:10, 
			lengthMenu: [5, 10, 25, 50, 100],
			layout: {
				topStart: 'buttons'
			},
			buttons: {
				dom: {
					button: { className: 'btn waves-effect waves-light' }
				},
				buttons: [
					{
						extend:'csv',
						text: '<i class="material-iconse left">download</i>CSV'
					}
				]
			}
		});

		targetElement.appendChild(tableDiv);
	});
}
	
