<script>
	import FlexiBoard from '$lib/components/flexi-board.svelte';
	import FlexiTarget from '$lib/components/flexi-target.svelte';
	import FlexiWidget from '$lib/components/flexi-widget.svelte';
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<div class="flex min-h-0 flex-col items-center gap-16 py-16">
	<div class="flex items-end">
		<FlexiBoard>
			<FlexiTarget
				config={{
					layout: {
						type: 'sparse'
					},
					rows: 3,
					columns: 3
				}}
				class="h-32 w-32 gap-1"
			>
				<FlexiWidget class="h-full w-full rounded-sm bg-orange-500" draggable x={0} y={1} width={2}
				></FlexiWidget>
				<FlexiWidget class="h-full w-full rounded-sm bg-orange-500" draggable x={0} y={0} width={3}
				></FlexiWidget>
				<FlexiWidget class="h-full w-full rounded-sm bg-orange-500" draggable x={0} y={2} width={1}
				></FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
		<h1 class="font-display text-6xl">Flexiboards</h1>
	</div>
	<h2 class="text-2xl">Headless, reactive drag and drop components. Made for Svelte 5.</h2>
</div>

<FlexiBoard
	class="flex h-[40vh] justify-between"
	config={{
		targetDefaults: {
			layout: {
				type: 'dense',
				rows: 1
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
		class="h-full w-96 space-y-4 rounded-lg border px-4 py-2 transition-transform duration-500"
		name="center"
		debug
	>
		{#snippet header()}
			<h2 class="text-lg font-bold">In Progress</h2>
		{/snippet}
		<FlexiWidget class="w-full rounded-lg bg-muted px-8 py-4" draggable
			>Save and load layouts</FlexiWidget
		>
	</FlexiTarget>

	<FlexiTarget class="h-full w-96 rounded-lg border px-4 py-2" name="right" debug>
		{#snippet header()}
			<h2 class="text-lg font-bold">Done</h2>
		{/snippet}
		<FlexiWidget class="w-full rounded-lg bg-muted px-8 py-4" draggable
			>Drag widgets on click</FlexiWidget
		>
	</FlexiTarget>
</FlexiBoard>
