<script lang="ts">
	import { Construction } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { page } from '$app/state';

	let directory = [
		{
			section: 'Introduction',
			pages: [
				{
					title: 'Overview',
					href: '/docs/overview'
				},
				{
					title: 'Configuration',
					href: '/docs/configuration'
				},
				{
					title: 'Controllers',
					href: '/docs/controllers'
				}
			]
		},
		{
			section: 'Guides',
			pages: [
				// {
				// 	title: 'Export & Import Boards',
				// 	href: '/docs/guides/exporting-importing-boards'
				// },
				{
					title: 'Transitions',
					href: '/docs/transitions'
				},
				{
					title: 'Widget Rendering',
					href: '/docs/widget-rendering'
				},
				// {
				// 	title: 'Managing Widgets',
				// 	href: '/docs/managing-widgets'
				// },
				{
					title: 'Free-Form Grids',
					href: '/docs/free-form-grids'
				},
				{
					title: 'Flow Grids',
					href: '/docs/flow-grids'
				},
				{
					title: 'Multiple Targets',
					href: '/docs/multiple-targets'
				}
			]
		},
		{
			section: 'Component API',
			pages: [
				{
					title: 'FlexiBoard',
					href: '/docs/components/board'
				},
				{
					title: 'FlexiTarget',
					href: '/docs/components/target'
				},
				{
					title: 'FlexiWidget',
					href: '/docs/components/widget'
				},
				{
					title: 'FlexiAdd',
					href: '/docs/components/adder'
				},
				{
					title: 'FlexiDelete',
					href: '/docs/components/deleter'
				}
			]
		}
		// {
		// 	section: 'Flexiboards',
		// 	pages: [
		// 		{
		// 			title: 'Roadmap',
		// 			href: '/docs/roadmap'
		// 		}
		// 	]
		// }
	];

	let { class: className = '' } = $props();
</script>

<div class={cn('flex min-h-0 flex-col gap-8', className)}>
	{#each directory as section}
		<div class="flex flex-col gap-1">
			<h2 class="mb-1 px-3 text-base font-semibold">{section.section}</h2>
			{#each section.pages as docPage}
				<Button
					variant="ghost"
					size="sm"
					class={[
						'inline-flex justify-start text-base font-normal text-muted-foreground hover:text-primary',
						docPage.href === page.url.pathname && 'text-primary'
					]}
					href={docPage.href}
				>
					{docPage.title}
				</Button>
			{/each}
		</div>
	{/each}
</div>
