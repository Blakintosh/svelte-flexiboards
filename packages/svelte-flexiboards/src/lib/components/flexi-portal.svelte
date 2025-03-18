<script lang="ts">
	import { flexiportal, destroyFlexiportal } from '$lib/system/portal.js';

	// Simply just wait until we're mounted to the DOM before initialising the portal.
	$effect(() => {
		flexiportal();

		// Garbage collect on destroy
		return () => {
			destroyFlexiportal();
		};
	});
</script>
