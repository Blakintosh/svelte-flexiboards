<script lang="ts">
	import {
		FlexiBoard,
		FlexiDelete,
		FlexiTarget,
		FlexiWidget,
		type AdderWidgetConfiguration,
		type FlexiDeleteController,
		springTransitionConfig,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import {
		FlexiAdd,
		type FlexiBoardConfiguration,
		type FlexiBoardController
	} from '@flexiboards/svelte';
	import NumberTile from '$lib/components/examples/numbers/number-tile.svelte';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash2 from 'lucide-svelte/icons/trash-2';

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggability: 'full',
			resizability: 'horizontal',
			transition: springTransitionConfig()
		}
	});

	// The drop preview is dashed fx-accent; the widget in hand reads as a
	// lifted card, not an accent outline.
	const className = (widget: FlexiWidgetController) => [
		'motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
		widget.isShadow &&
			'rounded-[14px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
		widget.isGrabbed && 'shadow-lift rotate-[2.5deg]'
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

<main class="bg-paper flex h-full min-h-0 w-full flex-col gap-8 px-12 py-8 lg:px-16">
	<header class="flex shrink-0 items-baseline justify-between gap-4">
		<h1 class="text-ink font-serif text-2xl lg:text-[30px]">Numbers</h1>
		<span class="text-faint text-[11.5px] font-semibold">3 × 3 · free grid · add and delete</span>
	</header>

	<FlexiBoard
		class="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6"
		config={boardConfig}
		bind:controller={boardController}
	>
		<FlexiAdd
			{addWidget}
			class={'ui border-rule-soft bg-stage text-faint hover:border-ink hover:bg-tint hover:text-ink flex size-32 flex-col items-center justify-center rounded-[14px] border border-dashed p-4 text-center text-xs transition-colors duration-[120ms] lg:size-40'}
		>
			<Plus class="mb-2 size-8 lg:size-12" />
			Add a random number
		</FlexiAdd>
		<FlexiTarget
			key="target"
			class={'border-rule-soft bg-panel shadow-card lg:h-128 aspect-square h-64 gap-2 rounded-[14px] border p-4 lg:gap-6'}
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
		<FlexiDelete
			class={(deleter: FlexiDeleteController) => [
				'ui border-rule-soft bg-stage text-faint flex size-32 flex-col items-center justify-center rounded-[14px] border border-dashed p-4 text-center text-xs transition-colors duration-[120ms] lg:size-40',
				deleter.isHovered && 'border-fx-accent/50 bg-tint-accent text-fx-accent-hover'
			]}
		>
			<Trash2 class="mb-2 size-8 lg:size-12" />
			Delete

			<span class="sr-only">Drag a widget here to delete it</span>
		</FlexiDelete>
	</FlexiBoard>
</main>
