export type ExampleStatus = 'loading' | 'ready' | 'error';

export function reportExampleStatus(status: ExampleStatus) {
	if (window.parent === window) return;
	window.parent.postMessage(
		{ type: 'flexiboards:example-status', status, path: window.location.pathname },
		window.location.origin
	);
}
