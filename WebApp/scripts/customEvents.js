export const createPreviewUpdateEvent = (docId) => 
	new CustomEvent('UpdateStepPreview', {
		detail: {docId, timestamp:Date.now()},
		bubbles: true,
		cancelable:true
	});
