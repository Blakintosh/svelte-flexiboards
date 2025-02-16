<script>
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
	import { Button } from '$lib/components/ui/button';
	$effect(() => {
		document.title = 'Flexiboards';
	});
</script>

<div class="grid h-full w-full place-items-center">
	<div class="flex min-h-0 flex-col items-center gap-16 py-8 lg:py-16">
		<div class="flex flex-col items-center gap-4 lg:flex-row lg:items-end lg:gap-0">
			<FlexiBoard>
				<FlexiTarget
					config={{
						layout: {
							type: 'free'
						},
						baseRows: 3,
						baseColumns: 3
					}}
					class="size-24 gap-[0.175rem] lg:size-32 lg:gap-1"
				>
					<FlexiWidget
						class="h-full w-full rounded-sm bg-orange-500"
						draggable
						x={0}
						y={1}
						width={2}
					></FlexiWidget>
					<FlexiWidget
						class="h-full w-full rounded-sm bg-orange-500"
						draggable
						x={0}
						y={0}
						width={3}
					></FlexiWidget>
					<FlexiWidget
						class="h-full w-full rounded-sm bg-orange-500"
						draggable
						x={0}
						y={2}
						width={1}
					></FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
			<h1 class="font-display text-4xl lg:text-6xl">Flexiboards</h1>
		</div>
		<h2 class="text-center text-xl lg:text-2xl">
			Headless, reactive drag and drop components for Svelte 5.
		</h2>

		<div class="flex flex-col gap-4 lg:flex-row">
			<Button
				class="h-12 px-12 py-4 text-2xl"
				href="https://www.npmjs.com/package/svelte-flexiboards"
				target="_blank">Install</Button
			>
			<Button class="h-12 px-12 py-4 text-2xl" href="/docs">Docs</Button>
			<Button class="h-12 px-12 py-4 text-2xl" href="/examples">Examples</Button>
		</div>
	</div>
</div>
