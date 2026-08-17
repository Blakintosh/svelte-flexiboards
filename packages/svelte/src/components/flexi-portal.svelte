<script lang="ts">
	import { destroyFlexiportal, flexiportal } from '@flexiboards/core';
	import { onMount } from 'svelte';
	import { getInternalFlexiboardCtx } from '../adapters/board.js';

	// Context must be resolved during component init — onMount is too late.
	const board = getInternalFlexiboardCtx();

	// Simply just wait until we're mounted to the DOM before initialising the portal.
	onMount(() => {
		flexiportal(board);

		// Garbage collect on destroy
		return () => {
			destroyFlexiportal();
		};
	});
</script>
