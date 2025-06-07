<script lang="ts">
	import { getFlexiwidgetInterpolatorCtx } from '$lib/system/widget/index.js';
	import { onMount } from 'svelte';

	const interpolator = getFlexiwidgetInterpolatorCtx();

	let ref: HTMLElement;

	onMount(() => interpolator.onPlaceholderMount(ref));
</script>

<div style={interpolator.placeholderStyle} bind:this={ref}></div>
