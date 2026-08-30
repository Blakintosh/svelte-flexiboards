<script lang="ts">
	import {
		FlexiBoard,
		FlexiDelete,
		FlexiTarget,
		FlexiWidget,
		type AdderWidgetConfiguration,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import {
		FlexiAdd,
		type FlexiBoardConfiguration,
		type FlexiBoardController
	} from '@flexiboards/svelte';
	import FlowTile from '$lib/components/examples/flow/flow-tile.svelte';

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: true,
			resizability: 'horizontal'
		}
	});

	// Anything provisional — the drop preview, the widget in hand — is dashed fx-accent.
	const className = (widget: FlexiWidgetController) => [
		widget.isShadow && 'border border-dashed border-fx-accent bg-tint-accent opacity-70',
		widget.isGrabbed && 'border border-fx-accent opacity-60'
	];

	let boardController: FlexiBoardController = $state() as FlexiBoardController;
</script>

<main class="flex h-full min-h-0 w-full flex-col gap-8 bg-paper px-12 py-8 lg:px-16">
	<header class="flex shrink-0 items-baseline justify-between gap-4">
		<h1 class="font-serif text-2xl text-ink lg:text-[30px]">Flow</h1>
		<span class="label text-[10px] text-faint">3 × 3 · flow · row axis</span>
	</header>

	<FlexiBoard
		class="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6"
		config={boardConfig}
		bind:controller={boardController}
	>
		<FlexiTarget
			key="target"
			class={'aspect-square h-64 gap-2 border border-ink bg-panel p-4 lg:h-128 lg:gap-6'}
			config={{
				rowSizing: 'minmax(0, 6rem)',
				layout: {
					type: 'flow',
					flowAxis: 'row',
					placementStrategy: 'append',
					rows: 3,
					columns: 3
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
