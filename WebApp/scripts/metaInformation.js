import { loadConfig } from '../config/config.js'

let databaseInfoRouteGeneral = "";

loadConfig().then(config => {
	databaseInfoRouteGeneral = response.METAINFORMATION_URL;
});


async function storeMetainformation() {
	try {
		const response = await fetch(databaseInfoRouteGeneral);
		const responseJSON = await response.json();
		console.log(responseJSON);
		localStorage.setItem("metaInformation", JSON.stringify(responseJSON))
	} catch (error) {
		console.log(error);
		console.error("Error fetching metaInformation");
		return []
	}
}

export function getMetaInformation() {
	const metaInformation = localStorage.getItem("metaInformation");
	return metaInformation ? JSON.parse(metaInformation) : [];
}

// document.addEventListener("DOMContentLoaded", storeAvailableDatabases);
document.addEventListener("DOMContentLoaded", storeMetainformation);
