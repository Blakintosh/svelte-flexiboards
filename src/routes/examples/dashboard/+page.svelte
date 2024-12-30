<script>
	import FlexiBoard from '$lib/components/flexi-board.svelte';
	import FlexiTarget from '$lib/components/flexi-target.svelte';
	import FlexiWidget from '$lib/components/flexi-widget.svelte';
</script>

<svelte:head>
	<title>Flexiboards</title>
</svelte:head>

<FlexiBoard>
	<FlexiTarget
		class="h-full w-full rounded-lg border px-4 py-2"
		name="left"
		debug
		config={{
			rows: 5,
			columns: 5,
			expandColumns: true,
			expandRows: true
		}}
	>
		{#snippet header()}
			<h2 class="text-lg font-bold">Drag and drop dashboard</h2>
		{/snippet}
		<FlexiWidget class="w-full rounded-lg bg-muted px-8 py-4" draggable x={0} y={0}
			>A nice widget.</FlexiWidget
		>
		<FlexiWidget class="w-full rounded-lg bg-muted px-8 py-4" draggable width={2} x={1} y={1}
			>Another nice widget.</FlexiWidget
		>
		<FlexiWidget
			class="w-full rounded-lg bg-muted px-8 py-4"
			draggable
			width={2}
			height={2}
			x={2}
			y={2}
		>
			{#snippet children({ widget })}
				{#if widget.grabbed}
					I'm currently being dragged.
				{:else}
					I'm currently placed at ({widget.x}, {widget.y}), and I've got a width of {widget.width} and
					a height of {widget.height}.
				{/if}
			{/snippet}
		</FlexiWidget>
	</FlexiTarget>
</FlexiBoard>
