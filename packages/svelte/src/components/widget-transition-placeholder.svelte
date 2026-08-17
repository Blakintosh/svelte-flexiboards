<script lang="ts">
	import { onMount } from 'svelte';
	import { getFlexiwidgetInterpolatorCtx } from '../adapters/widget.js';
	import { fromCore } from '../adapter.svelte.js';

	const interpolator = getFlexiwidgetInterpolatorCtx();

	let ref: HTMLElement;

	onMount(() => interpolator.onPlaceholderMount(ref));

	// The read must *call* the signal — tracking happens at read time.
	let placeholderStyle = $derived.by(fromCore(() => interpolator.placeholderStyle$()));
</script>

<div style={placeholderStyle} bind:this={ref}></div>
