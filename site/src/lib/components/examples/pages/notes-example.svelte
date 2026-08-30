<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		simpleTransitionConfig,
		type FlexiBoardController
	} from '@flexiboards/svelte';
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
	<main class="flex h-full min-h-0 grow flex-col bg-paper px-4 py-4 lg:px-8">
		<header class="mb-8 flex items-center justify-between border-b border-rule pb-3">
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

				<span class="label text-[10px] text-faint">Launch plan — 0.5</span>
				<span class="font-mono text-[10px] text-faint">Edited 2h ago</span>
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
				<h1 class="mb-8 pl-8 font-serif text-[30px] text-ink 2xl:text-[38px]">Launch plan — 0.5</h1>
				<!-- Real page content: the copy explains the demo the reader is dragging. -->
				<FlexiTarget key="page" class="gap-6">
					<FlexionBlockContainer
						component={FlexionTextBlock}
						props={{
							content:
								'The 0.5 release lands the React adapter and the new drop resolver. Everything below is drag-sortable — blocks are Flexiboards widgets on a one-column flow grid, so the page itself is the demo.'
						}}
					/>
					<FlexionBlockContainer component={FlexionHeadingBlock} props={{ content: 'This week' }} />
					<FlexionBlockContainer component={FlexionKanbanBlock} />
					<FlexionBlockContainer
						component={FlexionQuoteBlock}
						props={{
							label: 'Decision:',
							content:
								'we ship 0.5 when the resolver passes the reversal test on touch. No date-driven launches.'
						}}
					/>
					<FlexionBlockContainer
						component={FlexionTextBlock}
						props={{
							content:
								'Rollout: npm first, then the docs switchover. Keep 0.4 docs published for a month behind a version picker.'
						}}
					/>
				</FlexiTarget>
			</FlexiBoard>
		</article>
	</main>
</Sidebar.Provider>
