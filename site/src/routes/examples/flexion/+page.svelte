<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
	import Button from '$lib/components/ui/button/button.svelte';

	import FlexionTextBlock from '$lib/components/examples/flexion/flexion-text-block.svelte';
	import FlexionHeadingBlock from '$lib/components/examples/flexion/flexion-heading-block.svelte';
	import FlexionKanbanBlock from '$lib/components/examples/flexion/flexion-kanban-block.svelte';
</script>

<h1 class="mb-4 text-5xl font-semibold">Flexion</h1>
<h2 class="mb-8 text-2xl text-muted-foreground">A well known note taking app.</h2>

<div class="flex h-[810px] w-[1440px] items-stretch min-h-0 overflow-clip rounded-lg border">
	<aside class="w-72 shrink-0 bg-muted px-8 py-4">Acme Inc.</aside>
	<main class="grow px-8 py-4 flex flex-col min-h-0">
		<header class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<ul class="flex items-center">
					<li>
						<Button variant={'ghost'} size={'icon'} class={'[&_svg]:size-5'}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-arrow-left"
								><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg
							>
						</Button>
					</li>
					<li>
						<Button variant={'ghost'} size={'icon'} disabled class={'[&_svg]:size-5'}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="lucide lucide-arrow-right"
								><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
							>
						</Button>
					</li>
				</ul>

				<h3>My First Page</h3>
			</div>

			<ul class="flex items-center gap-2">
				<Button variant={'ghost'}>Share</Button>

				<Button variant={'ghost'} size={'icon'} class={'[&_svg]:size-5'}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-ellipsis"
						><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle
							cx="5"
							cy="12"
							r="1"
						/></svg
					>
				</Button>
			</ul>
		</header>
		<article class="flex w-full flex-col grow overflow-y-auto px-16 py-8 min-h-0">
			<h1 class="mb-8 text-4xl font-semibold">My First Page</h1>
			<FlexiBoard
				config={{
					targetDefaults: {
						layout: {
							type: 'flow',
							flowAxis: 'row',
							placementStrategy: 'append'
						}
					},
					widgetDefaults: {
						draggable: true
					}
				}}
			>
				<FlexiTarget name="page">
					<FlexiWidget component={FlexionTextBlock} />
					<FlexiWidget component={FlexionKanbanBlock} />
					<FlexiWidget component={FlexionHeadingBlock} />
					<FlexiWidget component={FlexionTextBlock} />
				</FlexiTarget>
			</FlexiBoard>
		</article>
	</main>
</div>
