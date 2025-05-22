<script module lang="ts">
	type SavedWidget = {
		x: number;
		y: number;
		number: number;
	};
</script>

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
	import NumberTile from '$lib/components/examples/numbers/number-tile.svelte';
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

	function addWidget(): AdderWidgetConfiguration {
		return {
			widget: {
				component: NumberTile,
				componentProps: {
					number: Math.floor(Math.random() * 10)
				},
				className
			},
			widthPx: 100,
			heightPx: 100
		};
	}

	let boardController: FlexiBoardController = $state() as FlexiBoardController;
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<main class="flex h-full min-h-0 w-full flex-col gap-8 px-12 py-8 lg:px-16">
	<h1 class="flex shrink-0 justify-between text-2xl font-semibold lg:text-3xl">Numbers.</h1>

	<FlexiBoard
		class="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6"
		config={boardConfig}
		bind:controller={boardController}
	>
		<FlexiAdd {addWidget}>
			{#snippet children({ props })}
				<button
					class="flex size-32 flex-col items-center justify-center rounded-lg border p-4 text-sm lg:size-40 lg:text-base"
					{...props}
				>
					<Plus class="mb-2 size-8 lg:size-12" />
					Add a random number
				</button>
			{/snippet}
		</FlexiAdd>
		<FlexiTarget
			key="target"
			class={'aspect-square h-64 gap-2 rounded-lg border p-4 lg:h-128 lg:gap-6'}
			config={{
				rowSizing: 'minmax(0, 1fr)',
				layout: {
					type: 'free',
					minRows: 3,
					minColumns: 3,
					maxRows: 3,
					maxColumns: 3
				}
			}}
		>
			<FlexiWidget
				class={className}
				component={NumberTile}
				componentProps={{ number: 1 }}
				x={0}
				y={0}
			/>
			<FlexiWidget
				class={className}
				component={NumberTile}
				componentProps={{ number: 5 }}
				x={1}
				y={2}
			/>
		</FlexiTarget>
		<FlexiDelete>
			{#snippet children({ props })}
				<div
					class="flex size-32 flex-col items-center justify-center rounded-lg border p-4 text-sm lg:size-40 lg:text-base"
					{...props}
				>
					<Trash2 class="mb-2 size-8 lg:size-12" />
					Delete
				</div>
			{/snippet}
		</FlexiDelete>
	</FlexiBoard>
</main>
