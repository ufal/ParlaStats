import { autoResizeTextarea } from './dynamic_form_render.js'
export function addDebugInfo (response) {
	console.log(response);
	const targetElement = document.getElementById('debug');
	const sqlWrapper = document.createElement('div');
	const title =  document.createElement('h6');
	title.textContent = "Produced SQL";
	sqlWrapper.appendChild(title);
	const textarea = document.createElement('textarea');
	textarea.value = response.SQL;
	sqlWrapper.appendChild(textarea);
	autoResizeTextarea(textarea);
	targetElement.appendChild(sqlWrapper);
}
