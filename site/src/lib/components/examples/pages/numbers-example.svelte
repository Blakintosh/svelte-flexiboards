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
			draggable: true,
			resizability: 'horizontal',
			transition: springTransitionConfig()
		}
	});

	// Anything provisional — the drop preview, the widget in hand — is dashed fx-accent.
	const className = (widget: FlexiWidgetController) => [
		widget.isShadow && 'border border-dashed border-fx-accent bg-tint-accent opacity-70',
		widget.isGrabbed && 'border border-fx-accent opacity-60'
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

<main class="flex h-full min-h-0 w-full flex-col gap-8 bg-paper px-12 py-8 lg:px-16">
	<header class="flex shrink-0 items-baseline justify-between gap-4">
		<h1 class="font-serif text-2xl text-ink lg:text-[30px]">Numbers</h1>
		<span class="label text-[10px] text-faint">3 × 3 · free · add and delete</span>
	</header>

	<FlexiBoard
		class="flex min-h-0 min-w-0 flex-col items-center justify-center gap-4 lg:flex-row lg:gap-6"
		config={boardConfig}
		bind:controller={boardController}
	>
		<FlexiAdd
			{addWidget}
			class={'ui text-xs flex size-32 flex-col items-center justify-center border border-dashed border-rule bg-tint-2 p-4 text-center text-faint transition-colors duration-[120ms] hover:border-ink hover:text-ink lg:size-40'}
		>
			<Plus class="mb-2 size-8 lg:size-12" />
			Add a random number
		</FlexiAdd>
		<FlexiTarget
			key="target"
			class={'aspect-square h-64 gap-2 border border-ink bg-panel p-4 lg:h-128 lg:gap-6'}
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
		<FlexiDelete class={(deleter: FlexiDeleteController) => [
			'ui text-xs flex size-32 flex-col items-center justify-center border border-dashed border-rule bg-tint-2 p-4 text-center text-faint duration-[120ms] lg:size-40',
			deleter.isHovered && 'border-fx-accent bg-tint-accent text-fx-accent'
		]}>
			<Trash2 class="mb-2 size-8 lg:size-12" />
			Delete

			<span class="sr-only">Drag a widget here to delete it</span>
		</FlexiDelete>
	</FlexiBoard>
</main>
