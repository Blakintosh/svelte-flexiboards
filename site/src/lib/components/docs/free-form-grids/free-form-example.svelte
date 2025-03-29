<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

<FlexiBoard class="size-96 rounded-xl border p-8">
	<FlexiTarget
		class={'h-full w-full gap-8'}
		containerClass={'w-full h-full'}
		config={{
			rowSizing: 'minmax(0, 1fr)',
			layout: {
				type: 'free',
				minRows: 2,
				minColumns: 2,
				maxRows: 2,
				maxColumns: 2
			}
		}}
	>
		<FlexiWidget x={0} y={0} class="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
			{#snippet children({ widget, component, componentProps })}
				I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
