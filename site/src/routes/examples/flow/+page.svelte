<script lang="ts">
	import {
		FlexiBoard,
		FlexiDelete,
		FlexiTarget,
		FlexiWidget,
		type AdderWidgetConfiguration,
		type FlexiWidgetController
	} from 'svelte-flexiboards';
	import {
		FlexiAdd,
		type FlexiBoardConfiguration,
		type FlexiBoardController
	} from 'svelte-flexiboards';
	import type { Component } from 'svelte';
	import FlowTile from '$lib/components/examples/flow/flow-tile.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: true,
			resizability: 'horizontal'
		}
	});

	const className = (widget: FlexiWidgetController) => [
		widget.isShadow && 'opacity-50',
		widget.isGrabbed && 'animate-pulse opacity-50'
	];

	let boardController: FlexiBoardController = $state() as FlexiBoardController;
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<main class="flex h-full min-h-0 w-full flex-col gap-8 px-12 py-8 lg:px-16">
	<h1 class="flex shrink-0 justify-between text-2xl font-semibold lg:text-3xl">Flow.</h1>

	<FlexiBoard
		class="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-8"
		config={boardConfig}
		bind:controller={boardController}
	>
		<FlexiTarget
			key="target"
			class={'aspect-square h-[16rem] gap-2 rounded-lg border p-4 lg:h-[32rem] lg:gap-8'}
			config={{
				baseRows: 3,
				baseColumns: 3,
				rowSizing: 'minmax(0, 1fr)',
				layout: {
					type: 'flow',
					flowAxis: 'row',
					placementStrategy: 'append'
				}
			}}
		>
			<FlexiWidget
				class={className}
				component={FlowTile}
				componentProps={{ content: 'Lorem' }}
				width={1}
			/>
			<FlexiWidget
				class={className}
				component={FlowTile}
				componentProps={{ content: 'ipsum' }}
				width={1}
			/>
			<FlexiWidget
				class={className}
				component={FlowTile}
				componentProps={{ content: 'dolor' }}
				width={2}
			/>
			<FlexiWidget
				class={className}
				component={FlowTile}
				componentProps={{ content: 'sit' }}
				width={3}
			/>
			<FlexiWidget
				class={className}
				component={FlowTile}
				componentProps={{ content: 'amet' }}
				width={2}
			/>
		</FlexiTarget>
	</FlexiBoard>
</main>
