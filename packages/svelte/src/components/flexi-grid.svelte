<script module lang="ts">
	import type { Snippet } from 'svelte';
	import { flexigrid } from '../adapters/grid.svelte.js';

	export type FlexiGridProps = {
		children?: Snippet;
		class?: string;
	};
</script>

<script lang="ts">
	import { fromCore } from '../adapter.svelte.js';

	let { children, class: className }: FlexiGridProps = $props();

	const { grid } = flexigrid();

	const columns = $derived.by(fromCore(() => grid.columns));
	const rows = $derived.by(fromCore(() => grid.rows));
	const style = $derived.by(fromCore(() => grid.style));
</script>

<div
	class={className}
	role="grid"
	aria-label="Drag-and-drop grid"
	aria-colcount={columns}
	aria-rowcount={rows}
	bind:this={grid.ref}
	{style}
>
	{@render children?.()}
</div>
