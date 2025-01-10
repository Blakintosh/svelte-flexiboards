<script lang="ts">
	let directory = [
		{
			section: 'Introduction',
			pages: [
				{
					title: 'Overview',
					href: '/docs/overview'
				}
			]
		},
		{
			section: 'Guides',
			pages: [
				{
					title: 'Export & Import Boards',
					href: '/docs/guides/exporting-importing-boards'
				},
				{
					title: 'Widget Rendering',
					href: '/docs/guides/widget-rendering'
				},
				{
					title: 'Managing Widgets',
					href: '/docs/guides/managing-widgets'
				},
				{
					title: 'Grid Layouts',
					href: '/docs/guides/grid-layouts'
				}
			]
		},
		{
			section: 'API',
			pages: [
				{
					title: 'FlexiBoard',
					href: '/docs/components/flexiboard'
				},
				{
					title: 'FlexiTarget',
					href: '/docs/components/flexitarget'
				},
				{
					title: 'FlexiWidget',
					href: '/docs/components/flexiwidget'
				}
			]
		},
		{
			section: 'Flexiboards',
			pages: [
				{
					title: 'Roadmap',
					href: '/docs/roadmap'
				}
			]
		}
	];
</script>

<aside class="flex flex-1 flex-col gap-8 py-16 text-base">
	{#each directory as section}
		<div class="flex flex-col gap-1">
			<h2 class="mb-1 text-lg font-semibold">{section.section}</h2>
			{#each section.pages as page}
				<a href={page.href} class="text-muted-foreground hover:text-primary">{page.title}</a>
			{/each}
		</div>
	{/each}
</aside>
