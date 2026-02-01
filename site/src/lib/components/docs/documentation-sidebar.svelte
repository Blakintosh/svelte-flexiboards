<script lang="ts">
	import {
		BookOpen,
		Settings,
		Gamepad2,
		Zap,
		LayoutGrid,
		Workflow,
		Columns3,
		LayoutList,
		Sparkles,
		Save,
		Smartphone,
		Box,
		Target,
		Component as LucideComponent,
		Plus,
		Trash2
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { cn } from '$lib/utils';
	import { page } from '$app/state';
	import type { Component } from 'svelte';

	type DocPage = {
		title: string;
		href: string;
		icon?: any;
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
					href: '/docs/overview',
					icon: BookOpen
				},
				{
					title: 'Configuration',
					href: '/docs/configuration',
					icon: Settings
				},
				{
					title: 'Controllers',
					href: '/docs/controllers',
					icon: Gamepad2
				},
				{
					title: 'Breaking Changes in v0.4',
					href: '/docs/breaking-changes-to-04',
					icon: Zap
				}
			]
		},
		{
			section: 'Guides',
			pages: [
				{
					title: 'Widget Rendering',
					href: '/docs/widget-rendering',
					icon: LucideComponent
				},
				{
					title: 'Free-Form Grids',
					href: '/docs/free-form-grids',
					icon: LayoutGrid
				},
				{
					title: 'Flow Grids',
					href: '/docs/flow-grids',
					icon: LayoutList
				},
				{
					title: 'Multiple Targets',
					href: '/docs/multiple-targets',
					icon: Columns3
				},
				{
					title: 'Transitions',
					href: '/docs/transitions',
					icon: Sparkles
				},
				{
					title: 'Exporting & Importing',
					href: '/docs/guides/exporting-importing-boards',
					icon: Save
				},
				{
					title: 'Responsive Layouts',
					href: '/docs/guides/responsive-layouts',
					icon: Smartphone
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

<nav class={cn('flex min-h-0 flex-col', className)}>
	{#each directory as section, i}
		{#if i > 0}
			<Separator class="my-4" />
		{/if}
		<div class="flex flex-col gap-0.5">
			<h2 class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{section.section}
			</h2>
			{#each section.pages as docPage}
				{@const isActive = docPage.href === page.url.pathname}
				<Button
					variant="ghost"
					size="sm"
					class={cn(
						'group inline-flex h-8 justify-start gap-2.5 px-2 text-sm font-normal text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
						isActive && 'bg-muted text-foreground'
					)}
					href={docPage.href}
				>
					{#if docPage.icon}
						<docPage.icon
							class={cn(
								'size-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground',
								isActive && 'text-foreground'
							)}
						/>
					{/if}
					<span class="truncate">{docPage.title}</span>
				</Button>
			{/each}
		</div>
	{/each}
</nav>
