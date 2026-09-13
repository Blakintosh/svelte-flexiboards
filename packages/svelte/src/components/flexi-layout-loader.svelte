<script lang="ts">
	import { getInternalFlexiboardCtx } from '../adapters/board.js';

	// Triggers the initial layout load. It must run after every other component
	// is instantiated, or the board's target layout is not established yet.

	const board = getInternalFlexiboardCtx();
	board.oninitialloadcomplete();
</script>
