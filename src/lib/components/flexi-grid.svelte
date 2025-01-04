<script module lang="ts">
	import { flexigrid } from '$lib/engine/grid.svelte';
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	export type FlexiGridProps = {
		children?: Snippet;
		class?: string;
	};
</script>

<script lang="ts">
	let { children, class: className }: FlexiGridProps = $props();

	const { grid } = flexigrid();
</script>

<div class={twMerge('grid gap-4', className)} bind:this={grid.ref} style={grid?.style}>
	{@render children?.()}
</div>
