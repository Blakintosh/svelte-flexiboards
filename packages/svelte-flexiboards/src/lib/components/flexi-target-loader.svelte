<script lang="ts">
	import { getFlexiboardCtx } from '$lib/system/provider.svelte.js';
	import { getFlexitargetCtx } from '$lib/system/target.svelte.js';

	// This is a simple component that triggers the initial layout load.
	// We must do this after instantiating all other components, otherwise we won't have established
	// the target layout of our Flexiboard.

	const target = getFlexitargetCtx();
	target.oninitialloadcomplete();
</script>
