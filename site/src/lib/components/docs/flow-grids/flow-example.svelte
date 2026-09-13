<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
</script>

<FlexiBoard class="border-ink bg-panel size-72 border p-8 lg:size-96">
	<FlexiTarget
		class={'h-full w-full gap-4 lg:gap-6'}
		containerClass={'w-full h-full'}
		config={{
			rowSizing: 'minmax(0, 1fr)',
			layout: {
				type: 'flow',
				rows: 4,
				columns: 1,
				placementStrategy: 'append',
				flowAxis: 'row'
			}
		}}
	>
		<FlexiWidget class="border-blue bg-tint text-blue border px-4 py-2 font-mono text-[12.5px]">
			{#snippet children({ widget }: { widget: FlexiWidgetController })}
				I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
		<FlexiWidget class="border-blue bg-tint text-blue border px-4 py-2 font-mono text-[12.5px]">
			{#snippet children({ widget }: { widget: FlexiWidgetController })}
				And I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
