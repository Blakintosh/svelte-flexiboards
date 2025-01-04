<script>
	import FlexiBoard from '$lib/components/flexi-board.svelte';
	import FlexiTarget from '$lib/components/flexi-target.svelte';
	import FlexiWidget from '$lib/components/flexi-widget.svelte';
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<div class="flex min-h-0 flex-col items-center gap-16 py-8 lg:py-16">
	<div class="flex items-end">
		<FlexiBoard>
			<FlexiTarget
				config={{
					layout: {
						type: 'free'
					},
					minRows: 3,
					minColumns: 3
				}}
				class="size-16 gap-0.5 lg:size-32 lg:gap-1"
			>
				<FlexiWidget class="h-full w-full rounded-sm bg-orange-500" draggable x={0} y={1} width={2}
				></FlexiWidget>
				<FlexiWidget class="h-full w-full rounded-sm bg-orange-500" draggable x={0} y={0} width={3}
				></FlexiWidget>
				<FlexiWidget class="h-full w-full rounded-sm bg-orange-500" draggable x={0} y={2} width={1}
				></FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
		<h1 class="font-display text-4xl lg:text-6xl">Flexiboards</h1>
	</div>
	<h2 class="text-center text-xl lg:text-2xl">
		Headless, reactive drag and drop components for Svelte 5.
	</h2>
</div>

<FlexiBoard
	class="flex h-[40vh] flex-col justify-between lg:flex-row"
	config={{
		targetDefaults: {
			layout: {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append'
			}
		}
	}}
>
	<FlexiTarget class="h-full w-96 rounded-lg border px-4 py-2" name="left" debug>
		{#snippet header()}
			<h2 class="text-lg font-bold">Backlog</h2>
		{/snippet}
		<div>
			<button>Add</button>
		</div>
	</FlexiTarget>

	<FlexiTarget
		class="h-full w-96 rounded-lg border px-4 py-2 transition-transform duration-500"
		name="center"
		debug
	>
		{#snippet header()}
			<h2 class="text-lg font-bold">In Progress</h2>
		{/snippet}
		<FlexiWidget class="w-full rounded-lg bg-muted px-8 py-4" draggable>
			{#snippet children({ widget })}
				I'm at {widget.x}, {widget.y}, with width {widget.width} and height {widget.height}
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>

	<FlexiTarget class="h-full w-96 rounded-lg border px-4 py-2" name="right" debug>
		{#snippet header()}
			<h2 class="text-lg font-bold">Done</h2>
		{/snippet}
		<FlexiWidget class="w-full rounded-lg bg-muted px-8 py-4" draggable>
			{#snippet children({ widget })}
				I'm also at {widget.x}, {widget.y}, with width {widget.width} and height {widget.height}
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
