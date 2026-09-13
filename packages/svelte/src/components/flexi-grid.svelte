<script module lang="ts">
	import type { Snippet } from 'svelte';
	import { flexigrid } from '../adapters/grid.svelte.js';

	export type FlexiGridProps = {
		children?: Snippet;
		accessibilityId: string;
		class?: ClassValue;
	};
</script>

<script lang="ts">
	import { assistiveTextStyle } from '@flexiboards/core';
	import { fromCore } from '../adapter.svelte.js';
	import type { ClassValue } from 'svelte/elements';

	let { children, class: className, accessibilityId }: FlexiGridProps = $props();

	const { grid, target } = flexigrid();

	const accessibilityRows = $derived.by(fromCore(() => target.accessibilityRows));
	const columns = $derived.by(fromCore(() => grid.columns));
	const rows = $derived.by(fromCore(() => grid.rows));
	const style = $derived.by(fromCore(() => grid.style));
</script>

<div
	class={className}
	role="grid"
	data-flexi-grid=""
	aria-label="Drag-and-drop grid"
	aria-colcount={Math.max(1, columns)}
	aria-rowcount={Math.max(1, rows)}
	bind:this={grid.ref}
	{style}
>
	<!-- aria-owns groups cells without remounting them on row changes or drop flights. -->
	{#each accessibilityRows as row (row.index)}
		<div
			role="row"
			aria-rowindex={row.index}
			aria-owns={row.cells.map((index) => `${accessibilityId}-cell-${index}`).join(' ')}
			style="position: absolute; width: 1px; height: 1px; pointer-events: none;"
		></div>
	{/each}
	{#if accessibilityRows.length === 0}
		<div role="row" aria-rowindex={1} style="display: contents;">
			<div role="gridcell" aria-colindex={1} style={assistiveTextStyle}>Empty drop target</div>
		</div>
	{/if}
	{@render children?.()}
</div>
