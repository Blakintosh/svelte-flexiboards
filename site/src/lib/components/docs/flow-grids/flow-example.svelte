<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

<FlexiBoard class="size-72 border border-ink bg-panel p-8 lg:size-96">
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
		<FlexiWidget class="border border-blue bg-tint px-4 py-2 font-mono text-[12.5px] text-blue">
			{#snippet children({ widget, component, componentProps })}
				I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
		<FlexiWidget class="border border-blue bg-tint px-4 py-2 font-mono text-[12.5px] text-blue">
			{#snippet children({ widget, component, componentProps })}
				And I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
