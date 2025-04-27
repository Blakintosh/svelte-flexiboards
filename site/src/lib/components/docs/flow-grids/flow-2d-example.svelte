<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

<FlexiBoard class="size-72 lg:size-96 rounded-xl border p-8">
	<FlexiTarget
		class={'h-full w-full gap-4 lg:gap-6'}
		containerClass={'w-full h-full'}
		config={{
			rowSizing: 'minmax(0, 1fr)',
			layout: { 
                type: 'flow', 
                rows: 4,
                columns: 2,
                placementStrategy: 'append',
                flowAxis: 'row'
            }
		}}
	>
		<FlexiWidget class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
			A
		</FlexiWidget>
		<FlexiWidget class="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground" width={2}>
			B
		</FlexiWidget>
		<FlexiWidget class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
			C
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>