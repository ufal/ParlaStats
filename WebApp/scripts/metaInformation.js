import{ loadConfig } from '../config/config.js'

// Await loading metainformation endpoint url from frontent config file.
const { METAINFORMATION_URL } = await loadConfig();

let cached;

// Function that is used to fetch metainformation. If we have it cached, return cahced
// else request from metainformation endpoint of the backend
export async function loadMetainformation() {
	if (cached) {
		return cached;
	}
	const res = await fetch(METAINFORMATION_URL);
	if (!res.ok) throw new Error(`Metainformation fetch failed (${res.status})`);
	cached = await res.json();
	return cached;
}

export const metaInformationPromise = loadMetainformation();

export function getMetainformation() {
	if (!cached) throw new Error('Call loadMetainformation() first!');
	return cached;
}
