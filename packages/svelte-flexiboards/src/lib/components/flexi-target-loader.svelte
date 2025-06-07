<script lang="ts">
	import { getInternalFlexitargetCtx } from '$lib/system/target/index.js';

	// This is a simple component that triggers the initial layout load.
	// We must do this after instantiating all other components, otherwise we won't have established
	// the target layout of our Flexiboard.

	const target = getInternalFlexitargetCtx();
	target.oninitialloadcomplete();
</script>
