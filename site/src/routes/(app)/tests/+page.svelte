<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
	import type { FlexiBoardConfiguration, FlexiWidgetController } from 'svelte-flexiboards';

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: true,
			resizability: 'none'
		}
	});

	const widgetClass = (widget: FlexiWidgetController) => [
		'p-4 text-white rounded',
		widget.isShadow && 'bg-green-500 opacity-60',
		widget.isGrabbed && 'bg-blue-900 opacity-50 ring-2 ring-yellow-400',
		!widget.isShadow && !widget.isGrabbed && 'bg-blue-700'
	];

	const widgets = Array.from({ length: 12 }, (_, i) => `Widget ${i + 1}`);
</script>

<h1 class="mt-8 text-center text-2xl font-bold">
	Hi there, it looks like you found the (not so secret) test page!
</h1>

<p class="text-muted-foreground mb-8 text-center">
	Scroll the grid right, then try dragging a widget. It should land where you drop it, not offset
	to the left.
</p>

<div class="grid h-full max-h-[80vh] w-full place-items-center justify-items-center">
	<div class="relative container min-w-0" style="max-width: 600px;">
		<FlexiBoard class={'w-full border border-red-500 overflow-x-auto'} config={boardConfig}>
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
