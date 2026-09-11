<script lang="ts">
	import { destroyFlexiportal, flexiportal } from '@flexiboards/core';
	import { onMount } from 'svelte';
	import { getInternalFlexiboardCtx } from '../adapters/board.js';

	// Context must be resolved during component init. onMount is too late.
	const board = getInternalFlexiboardCtx();

	// Wait until mounted to the DOM before initialising the portal.
	onMount(() => {
		flexiportal(board);

		return () => {
			destroyFlexiportal();
		};
	});
</script>
