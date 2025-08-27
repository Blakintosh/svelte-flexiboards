<script lang="ts">
	import { flexiportal, destroyFlexiportal } from '$lib/system/portal.js';
	import { onMount } from 'svelte';

	// Simply just wait until we're mounted to the DOM before initialising the portal.
	onMount(() => {
		flexiportal();

		// Garbage collect on destroy
		return () => {
			destroyFlexiportal();
		};
	});
</script>
