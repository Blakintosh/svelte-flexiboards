<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
	import type { FlexiBoardConfiguration } from 'svelte-flexiboards';

	let editMode = $state(true);

	let boardConfig: FlexiBoardConfiguration = $state({
		widgetDefaults: {
			draggable: true,
			resizability: 'horizontal'
		}
	});
</script>

<h1 class="mt-8 text-center text-2xl font-bold">
	Hi there, it looks like you found the (not so secret) test page!
</h1>

<p class="text-muted-foreground mb-8 text-center">
	Nothing to see here - just a bit of occasional debugging.
</p>

<div
	class="grid h-full max-h-[80vh] w-full place-items-center justify-items-center overflow-y-auto"
>
	<div class="relative container min-w-0">
		<FlexiBoard class={'w-full border border-red-500'} config={boardConfig}>
			<FlexiTarget
				key="left"
				class={'h-full gap-2 lg:gap-4'}
				config={{
					rowSizing: 'minmax(0, 1fr)',
					layout: {
						type: 'free',
						minColumns: 3,
						maxColumns: 3,
						minRows: 2,
						maxRows: 4,
						colllapsibility: 'any'
					}
				}}
			>
				<FlexiWidget
					x={0}
					y={0}
					draggable={false}
					resizability={'none'}
					class="bg-blue-700 p-4 text-white"
				>
					Overall Score
				</FlexiWidget>
				<FlexiWidget x={1} y={0} class="bg-blue-700 p-4 text-white">Total Revenue</FlexiWidget>
				<FlexiWidget x={2} y={0} class="bg-blue-700 p-4 text-white">Subscriptions</FlexiWidget>
				<FlexiWidget x={0} y={1} width={3} class="bg-blue-700 p-4 text-white">Sales</FlexiWidget>
				<FlexiWidget x={0} y={2} class="bg-blue-700 p-4 text-white">Active Now</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	</div>
</div>
