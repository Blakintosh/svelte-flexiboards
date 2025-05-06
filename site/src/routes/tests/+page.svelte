<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
</script>

<h1 class="mt-8 text-center text-2xl font-bold">
	Hi there, it looks like you found the (not so secret) test page!
</h1>

<p class="mb-8 text-center text-muted-foreground">
	Nothing to see here - just a bit of occasional debugging.
</p>

<div
	class="grid h-full max-h-[80vh] w-full place-items-center justify-items-center overflow-y-auto"
>
	<div class="container relative min-w-0">
		<FlexiBoard class={'w-full border border-red-500'}>
			<FlexiTarget
				key="test"
				config={{
					layout: {
						type: 'free',
						minColumns: 3,
						minRows: 3,
						maxColumns: 3
					},
					rowSizing: 'minmax(0, 8rem)',
					widgetDefaults: {
						className: 'bg-blue-700 text-white'
					}
				}}
				class={'gap-8'}
			>
				<FlexiWidget x={0} y={0} width={3} height={3}>a</FlexiWidget>

				<FlexiWidget x={0} y={3} width={1} height={1}>b</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	</div>
</div>
