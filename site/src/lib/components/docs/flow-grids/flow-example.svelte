<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

<FlexiBoard class="size-72 lg:size-96 rounded-xl border p-8">
	<FlexiTarget
		class={'h-full w-full gap-4 lg:gap-8'}
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
		<FlexiWidget class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
			{#snippet children({ widget, component, componentProps })}
				I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
		<FlexiWidget class="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground">
			{#snippet children({ widget, component, componentProps })}
			    And I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>