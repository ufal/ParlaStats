export function addDebugInfo (response) {
	console.log(response);
	const targetElement = document.getElementById('results-table-wrapper');
	const sqlWrapper = document.createElement('div');
	const title =  document.createElement('h6');
	title.textContent = "Produced SQL";
	sqlWrapper.appendChild(title);
	const textarea = document.createElement('textarea');
	textarea.value = response.SQL;
	textarea.style.overflow = 'hidden';
	textarea.style.resize = 'none';
	textarea.style.height = 'auto';
	requestAnimationFrame(() => {
		textarea.style.height = textarea.scrollHeight + 'px';
	});
	sqlWrapper.appendChild(textarea);
	targetElement.appendChild(sqlWrapper);
}
