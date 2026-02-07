<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		simpleTransitionConfig,
		type FlexiBoardController
	} from 'svelte-flexiboards';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	import AppSidebar from '$lib/components/examples/flexion/app-sidebar.svelte';
	import FlexionTextBlock from '$lib/components/examples/flexion/flexion-text-block.svelte';
	import FlexionHeadingBlock from '$lib/components/examples/flexion/flexion-heading-block.svelte';
	import FlexionQuoteBlock from '$lib/components/examples/flexion/flexion-quote-block.svelte';
	import FlexionKanbanBlock from '$lib/components/examples/flexion/flexion-kanban-block.svelte';
	import FlexionBlockContainer from '$lib/components/examples/flexion/flexion-block-container.svelte';

	import Menu from 'lucide-svelte/icons/menu';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';

	let board: FlexiBoardController | undefined = $state();
</script>

<Sidebar.Provider class="h-full min-h-0">
	<AppSidebar />
	<main class="flex h-full min-h-0 grow flex-col px-4 py-4 lg:px-8">
		<header class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button variant={'ghost'} size={'icon'} class={'lg:hidden [&_svg]:size-5'}>
					<Menu />
				</Button>

				<ul class="hidden items-center lg:flex">
					<li>
						<Button variant={'ghost'} size={'icon'} class={'[&_svg]:size-5'}>
							<ArrowLeft />
						</Button>
					</li>
					<li>
						<Button variant={'ghost'} size={'icon'} disabled class={'[&_svg]:size-5'}>
							<ArrowRight />
						</Button>
					</li>
				</ul>

				<h3>My First Page</h3>
			</div>

			<ul class="flex items-center gap-2">
				<Button variant={'ghost'} class="hidden lg:block">Share</Button>

				<Button variant={'ghost'} size={'icon'} class={'[&_svg]:size-5'}>
					<Ellipsis />
				</Button>
			</ul>
		</header>
		<article class="flex min-h-0 w-full grow flex-col">
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
						draggable: true,
						transition: simpleTransitionConfig()
					}
				}}
				bind:controller={board}
				class="overflow-y-auto py-8 2xl:pl-8 2xl:pr-16"
			>
				<h1 class="mb-8 pl-8 text-3xl 2xl:text-4xl font-semibold">My First Page</h1>
				<FlexiTarget key="page" class="gap-8">
					<FlexionBlockContainer component={FlexionTextBlock} />
					<FlexionBlockContainer component={FlexionKanbanBlock} />
					<FlexionBlockContainer component={FlexionHeadingBlock} />
					<FlexionBlockContainer component={FlexionQuoteBlock} />
					<FlexionBlockContainer component={FlexionTextBlock} />
				</FlexiTarget>
			</FlexiBoard>
		</article>
	</main>
</Sidebar.Provider>
