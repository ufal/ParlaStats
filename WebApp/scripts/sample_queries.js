import { loadConfig } from '../config/config.js'
import { loadQuery } from './dynamic_form_render.js'

const { SAMPLES_URL } = await loadConfig();

export async function addSampleQueries() {
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
		
		const button = document.createElement('a');
		button.className = 'waves-effect waves-light btn sample-btn';
		button.textContent = 'Load';
		sampleDetail.id = `Sample_${i}`;

		const summary = document.createElement('summary');
		summary.className = 'common-text';
		summary.textContent = `Sample_${i}`;
		sampleDetail.appendChild(summary);
		
		const descriptionText = document.createElement('p');
		descriptionText.className = 'slightly-smaller-text';
		descriptionText.textContent = sampleQuery.description || sample.filename;
		sampleDetail.appendChild(descriptionText);
		
		
		button.addEventListener('click', () => {
			console.log('here');
			console.log(sampleQuery);
			loadQuery(JSON.stringify(sampleQuery));
		});

		sampleDetail.appendChild(button);
		i++;
		const listElement = document.createElement('li');
		listElement.appendChild(sampleDetail);
		samplesList.appendChild(listElement);

	});
}

