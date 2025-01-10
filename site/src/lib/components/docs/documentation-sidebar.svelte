<script lang="ts">
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
		// {
		// 	section: 'Guides',
		// 	pages: [
		// 		{
		// 			title: 'Export & Import Boards',
		// 			href: '/docs/guides/exporting-importing-boards'
		// 		},
		// 		{
		// 			title: 'Widget Rendering',
		// 			href: '/docs/guides/widget-rendering'
		// 		},
		// 		{
		// 			title: 'Managing Widgets',
		// 			href: '/docs/guides/managing-widgets'
		// 		},
		// 		{
		// 			title: 'Grid Layouts',
		// 			href: '/docs/guides/grid-layouts'
		// 		}
		// 	]
		// },
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
