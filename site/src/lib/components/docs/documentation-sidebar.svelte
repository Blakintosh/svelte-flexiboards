<script lang="ts">
	import { Construction } from 'lucide-svelte';

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
				// {
				// 	title: 'Transitions',
				// 	href: '/docs/transitions'
				// },
				{
					title: 'Widget Rendering',
					href: '/docs/widget-rendering'
				},
				{
					title: 'Managing Widgets',
					href: '/docs/managing-widgets'
				},
				{
					title: 'Free-Form Grids',
					href: '/docs/free-form-grids'
				}
			]
		},
		{
			section: 'API',
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
</script>

{#each directory as section}
	<div class="flex flex-col gap-1">
		<h2 class="mb-1 text-lg font-semibold">{section.section}</h2>
		{#each section.pages as page}
			<a href={page.href} class="text-muted-foreground hover:text-primary">{page.title}</a>
		{/each}
	</div>
{/each}
