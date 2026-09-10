<script lang="ts">
	import { getInternalFlexitargetCtx } from '../adapters/target.js';

	// Triggers the initial widget creation for the target. This runs during
	// component init (not onMount) so that it happens within the render pass, on
	// the server as well as the client. Placement in the markup is what makes it
	// correct: FlexiTarget renders this component *after* the children snippet
	// (whose FlexiWidget components register their configs during their own
	// init) and *before* the `{#if prepared}` widgets block — so by the time the
	// widgets block is evaluated, in the same top-down pass, the widgets exist.
	//
	// That single-pass ordering is what makes SSR and hydration agree: the
	// server renders the placed widgets, and the client's hydration pass
	// computes the same `prepared` state at the same point in the tree.

	const target = getInternalFlexitargetCtx();

	target.oninitialloadcomplete();
</script>
