import { loadConfig } from '../config/config.js'
import { loadQuery, send } from './dynamic_form_render.js'

const { SAMPLES_URL } = await loadConfig();

export async function addSampleQueries() {
	/* Function for rendering contents of the sample queries tab
	 * in query building menu
	 * */
	const response = await fetch(SAMPLES_URL);
	const samples = await response.json();
    
	const container = document.getElementById('samples');
	container.innerHTML = '';
	let i = 1;
	const samplesList = document.createElement('ul');
	container.appendChild(samplesList);
	samples.forEach(sample => {
		const sampleQuery = JSON.parse(sample.contents);
		const sampleDetail = document.createElement('details');
		sampleDetail.className = 'repeatable-row';
		
		const loadButton = document.createElement('a'); 
		loadButton.className = 'waves-effect waves-light btn sample-btn';
		loadButton.textContent = 'Load';
		
		const sendButton = document.createElement('a');
		sendButton.className = 'waves-effect waves-light btn sample-btn';
		sendButton.textContent = 'Send';

		sampleDetail.id = `Sample_${i}`;

		const summary = document.createElement('summary');
		summary.className = 'common-text';
		summary.textContent = `Sample_${i}`;
		sampleDetail.appendChild(summary);
		
		const descriptionText = document.createElement('p');
		descriptionText.className = 'slightly-smaller-text';
		descriptionText.textContent = sampleQuery.description || sample.filename;
		sampleDetail.appendChild(descriptionText);
		
		
		loadButton.addEventListener('click', () => {
			loadQuery(JSON.stringify(sampleQuery));
		});

		sendButton.onclick = () => { 
			loadQuery(JSON.stringify(sampleQuery));
			send(); 
		}

		sampleDetail.appendChild(loadButton);
		sampleDetail.appendChild(sendButton);
		i++;
		const listElement = document.createElement('li');
		listElement.appendChild(sampleDetail);
		samplesList.appendChild(listElement);

	});
}

