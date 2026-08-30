<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from '@flexiboards/svelte';
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
				columns: 2,
				placementStrategy: 'append',
				flowAxis: 'row'
			}
		}}
	>
		<FlexiWidget
			class="grid place-items-center border border-blue bg-tint px-4 py-2 font-mono text-[12.5px] text-blue"
		>
			A
		</FlexiWidget>
		<FlexiWidget
			class="grid place-items-center border border-blue bg-tint px-4 py-2 font-mono text-[12.5px] text-blue"
			width={2}
		>
			B
		</FlexiWidget>
		<FlexiWidget
			class="grid place-items-center border border-blue bg-tint px-4 py-2 font-mono text-[12.5px] text-blue"
		>
			C
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
