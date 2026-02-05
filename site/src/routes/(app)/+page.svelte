<script>
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import Rocket from 'lucide-svelte/icons/rocket';
	$effect(() => {
		document.title = 'Flexiboards';
	});
</script>

<div class="grid h-full w-full grow place-items-center">
	<div class="flex h-full min-h-0 flex-col items-center justify-center gap-16 py-8 lg:py-16">
		<div class="flex flex-col items-center gap-4 lg:flex-row lg:items-end lg:gap-0">
			<FlexiBoard>
				<FlexiTarget
					config={{
						layout: {
							type: 'free',
							minRows: 3,
							minColumns: 3,
							maxRows: 3,
							maxColumns: 3
						}
						// rowSizing: '2.4rem',
						// columnSizing: '2.4rem'
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
			The headless drag-and-drop toolkit for Svelte.
		</h2>
		<Badge class="gap-4 px-6 py-0.5 text-lg" variant={'outline'}>
			<Rocket size={32} class="size-8 text-xl" />
			Version 0.4 out now!
		</Badge>

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
