<script lang="ts">
	import FlexiBoard from '../../src/components/flexi-board.svelte';
	import FlexiTarget from '../../src/components/flexi-target.svelte';
	import FlexiWidget from '../../src/components/flexi-widget.svelte';
	import type { FlexiBoardConfiguration, FlexiWidgetController } from '@flexiboards/core';
	import type { ClassValue } from 'svelte/elements';

	let {
		x = 1,
		onCreated,
		config = {}
	}: {
		x?: number;
		onCreated?: (widget: FlexiWidgetController) => void;
		config?: FlexiBoardConfiguration<ClassValue>;
	} = $props();
	let show = $state(false);
	let label = $state('Late');
	let controller = $state<FlexiWidgetController>();
	export function add() {
		show = true;
	}
	export function rename() {
		label = 'Updated';
	}
	export function getController() {
		return controller;
	}
</script>

<FlexiBoard {config}>
	<FlexiTarget
		key="cards"
		config={{ layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 1, maxRows: 1 } }}
	>
		<FlexiWidget id="fixed" x={0} y={0} draggability="none">First</FlexiWidget>
		{#if show}
			<FlexiWidget id="late" {x} y={0} bind:controller onfirstcreate={onCreated}
				>{label}</FlexiWidget
			>
		{/if}
	</FlexiTarget>
</FlexiBoard>
