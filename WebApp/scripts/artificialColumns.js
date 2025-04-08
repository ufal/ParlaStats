let artificialColumns = {
	"month": {
		"formula":"EXTRACT(MONTH FROM speech.date)",
		"type":"integer"
	},
	"year": {
		"formula":"EXTRACT(YEAR FROM speech.date)",
		"type":"integer"
	},
	"day_of_the_week": {
		"formula":"EXTRACT(DOW FROM speech.date)",
		"type":"integer"
	},
	"words_per_minute": {
		"formula":"(speech.token_count / (speech.total_duration / 60000))",
		"type":"real"
	}
}

function storeArtificialColumns() {
	localStorage.setItem("ArtificialColumns", JSON.stringify(artificialColumns));
}
export function getArtificialColumns() {
	const artificialColumns = localStorage.getItem("ArtificialColumns");
	return artificialColumns ? JSON.parse(artificialColumns) : [];
}

document.addEventListener("DOMContentLoaded", storeArtificialColumns);
