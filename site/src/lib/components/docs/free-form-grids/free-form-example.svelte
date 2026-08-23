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
				type: 'free',
				minRows: 2,
				minColumns: 2,
				maxRows: 2,
				maxColumns: 2
			}
		}}
	>
		<FlexiWidget
			x={0}
			y={0}
			class="border border-blue bg-tint px-4 py-2 font-mono text-[12.5px] text-blue"
		>
			{#snippet children({ widget })}
				I'm at ({widget.x}, {widget.y})
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
