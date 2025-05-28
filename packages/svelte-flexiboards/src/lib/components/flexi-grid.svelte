<script module lang="ts">
	import { flexigrid } from '$lib/system/grid/index.js';
	import type { Snippet } from 'svelte';

	export type FlexiGridProps = {
		children?: Snippet;
		class?: string;
	};
</script>

<script lang="ts">
	let { children, class: className }: FlexiGridProps = $props();

	const { grid } = flexigrid();
</script>

<div
	class={className}
	role="grid"
	aria-label="Drag-and-drop grid"
	aria-colcount={grid.columns}
	aria-rowcount={grid.rows}
	bind:this={grid.ref}
	style={grid?.style}
>
	{@render children?.()}
</div>
