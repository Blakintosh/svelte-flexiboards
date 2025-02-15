<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		type FlexiBoardController
	} from 'svelte-flexiboards';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import AppSidebar from '$lib/components/examples/flexion/app-sidebar.svelte';
	import FlexionTextBlock from '$lib/components/examples/flexion/flexion-text-block.svelte';
	import FlexionHeadingBlock from '$lib/components/examples/flexion/flexion-heading-block.svelte';
	import FlexionKanbanBlock from '$lib/components/examples/flexion/flexion-kanban-block.svelte';
	import FlexionBlockContainer from '$lib/components/examples/flexion/flexion-block-container.svelte';

	let board: FlexiBoardController | undefined = $state();
</script>

<Sidebar.Provider class="h-full min-h-0">
	<AppSidebar />
	<main class="flex h-full min-h-0 grow flex-col px-4 py-4 lg:px-8">
		<header class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button variant={'ghost'} size={'icon'} class={'lg:hidden [&_svg]:size-5'}>
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
						class="lucide lucide-menu"
						><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line
							x1="4"
							x2="20"
							y1="18"
							y2="18"
						/></svg
					>
				</Button>

				<ul class="hidden items-center lg:flex">
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
				<Button variant={'ghost'} class="hidden lg:block">Share</Button>

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
		<article class="flex min-h-0 w-full grow flex-col overflow-y-auto py-8 lg:pl-8 lg:pr-16">
			<h1 class="mb-8 pl-8 text-4xl font-semibold">My First Page</h1>
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
				bind:controller={board}
			>
				<FlexiTarget key="page" class="gap-8">
					<FlexionBlockContainer component={FlexionTextBlock} />
					<FlexionBlockContainer component={FlexionKanbanBlock} />
					<FlexionBlockContainer component={FlexionHeadingBlock} />
					<FlexionBlockContainer component={FlexionTextBlock} />
				</FlexiTarget>
			</FlexiBoard>
		</article>
	</main>
</Sidebar.Provider>
