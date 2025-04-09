document.addEventListener("DOMContentLoaded", () => {
	const tabButtons = document.querySelectorAll(".tab-header button");
	const tabContents = document.querySelectorAll(".container .tab-content");

	tabButtons.forEach(button => {
		button.addEventListener("click", () => {
			tabButtons.forEach(btn => btn.classList.remove("active"));
			tabContents.forEach(panel => panel.classList.remove("active"));
			button.classList.add("active");
			const tabId = button.getAttribute("data-tab");
			document.getElementById(tabId).classList.add("active");
		});
	});
});
