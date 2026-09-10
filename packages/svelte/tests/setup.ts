import { flushSync } from 'svelte';
import { configure, installResizeObserver } from '@flexiboards/testing';

installResizeObserver();
// Every helper dispatch settles Svelte's DOM before it returns.
configure({
	flush: (work) => {
		const result = work();
		flushSync();
		return result;
	}
});
