export async function loadConfig() {
	const response = await fetch('config/conf.json');
	const config = await response.json();
	return config;
}
