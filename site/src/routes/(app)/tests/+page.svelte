<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
	import type { FlexiBoardConfiguration, FlexiWidgetController } from '@flexiboards/svelte';

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: true,
			resizability: 'none'
		}
	});

	const widgetClass = (widget: FlexiWidgetController) => [
		'label grid place-items-center p-4 text-[11px]',
		widget.isShadow && 'border border-dashed border-fx-accent bg-tint-accent text-fx-accent',
		widget.isGrabbed && 'border border-fx-accent bg-fx-accent text-white',
		!widget.isShadow && !widget.isGrabbed && 'border border-blue bg-tint text-blue'
	];

	const widgets = Array.from({ length: 12 }, (_, i) => `Widget ${i + 1}`);
</script>

<p class="mt-10 text-center"><span class="label text-[11px] text-fx-accent">Test sheet</span></p>

<h1 class="mt-3 text-center font-serif text-[30px] text-ink">Flow scroll offset</h1>

<p class="mx-auto mb-10 max-w-[68ch] text-center text-body">
	Scroll the grid right, then drag a widget. It should land where you drop it, not offset to the
	left.
</p>

<div class="grid h-full max-h-[80vh] w-full place-items-center justify-items-center">
	<div class="relative container min-w-0" style="max-width: 600px;">
		<FlexiBoard class={'w-full overflow-x-auto border border-ink bg-panel p-2'} config={boardConfig}>
			<FlexiTarget
				key="flow-scroll-test"
				class={'gap-2'}
				config={{
					columnSizing: '200px',
					rowSizing: '120px',
					layout: {
						type: 'flow',
						flowAxis: 'row',
						placementStrategy: 'append',
						columns: 6,
						rows: 2
					}
				}}
			>
				{#each widgets as label}
					<FlexiWidget class={widgetClass}>
						{label}
					</FlexiWidget>
				{/each}
			</FlexiTarget>
		</FlexiBoard>
	</div>
</div>
