// Navigation for tutorial pages.

document.addEventListener("DOMContentLoaded", () => {
	const formToggle = document.getElementById('form-toggle');
	const resToggle = document.getElementById('res-toggle');
	

	formToggle.onclick = () => {
		const formTutorial = document.getElementById('form-tutorial');
		const resTutorial = document.getElementById('res-tutorial');

		formTutorial.classList.add('active');
		resTutorial.classList.remove('active');
		resTutorial.style.display = "none";
		formTutorial.style.display = "block";
	};

	resToggle.onclick = () => {
		const formTutorial = document.getElementById('form-tutorial');
		const resTutorial = document.getElementById('res-tutorial');
		formTutorial.style.display = "none";
		resTutorial.style.dispaly = "block";
		formTutorial.classList.remove('active');
		resTutorial.classList.add('active');
	};
});
