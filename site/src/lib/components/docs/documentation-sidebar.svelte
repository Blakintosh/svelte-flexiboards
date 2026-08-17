<script lang="ts">
	import { cn } from '$lib/utils';
	import { page } from '$app/state';

	type DocPage = {
		title: string;
		href: string;
	};

	type Section = {
		section: string;
		pages: DocPage[];
	};

	let directory: Section[] = [
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
				},
				{
					title: 'Breaking Changes in v0.4',
					href: '/docs/breaking-changes-to-04'
				}
			]
		},
		{
			section: 'Guides',
			pages: [
				{
					title: 'Free-Form Grids',
					href: '/docs/free-form-grids'
				},
				{
					title: 'Flow Grids',
					href: '/docs/flow-grids'
				},
				{
					title: 'Widget Rendering',
					href: '/docs/widget-rendering'
				},
				{
					title: 'Multiple Targets',
					href: '/docs/multiple-targets'
				},
				{
					title: 'Transitions',
					href: '/docs/transitions'
				},
				{
					title: 'Exporting & Importing',
					href: '/docs/guides/exporting-importing-boards'
				},
				{
					title: 'Responsive Layouts',
					href: '/docs/guides/responsive-layouts'
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
					title: 'ResponsiveFlexiBoard',
					href: '/docs/components/responsive-board'
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
	];

	let { class: className = '' } = $props();
</script>

<!--
  Docs nav is the label voice throughout: faint mono section labels, mono items,
  and the active page in vermillion. No pills, no fills, no radius.
-->
<nav class={cn('flex min-h-0 flex-col', className)}>
	{#each directory as section, i}
		<div class={cn('flex flex-col', i > 0 && 'mt-8 border-t border-rule pt-6')}>
			<h2 class="label mb-3 text-[10px] text-faint">
				{section.section}
			</h2>
			{#each section.pages as docPage}
				{@const isActive = docPage.href === page.url.pathname}
				<a
					href={docPage.href}
					aria-current={isActive ? 'page' : undefined}
					class={cn(
						'truncate py-1.5 font-mono text-[12.5px] leading-snug no-underline transition-colors duration-[120ms]',
						isActive ? 'text-vermillion' : 'text-body hover:text-ink'
					)}
				>
					{docPage.title}
				</a>
			{/each}
		</div>
	{/each}
</nav>
