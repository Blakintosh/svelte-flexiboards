<script module lang="ts">
	type ExamplePage = {
		title: string;
		slug: string;
		description: string;
		href: string;
	};

	const pages: Record<string, ExamplePage> = {
		dashboard: {
			title: 'Dashboard',
			slug: 'dashboard',
			description: `A drag-and-drop SaaS dashboard. Built with code from <a href="https://next.shadcn-svelte.com/examples/dashboard" target="_blank" rel="noopener noreferrer">shadcn-svelte's Dashboard Example</a>.`,
			href: '/examples/dashboard'
		},
		notes: {
			title: 'Notes',
			slug: 'notes',
			description: 'A popular note-taking app.',
			href: '/examples/notes'
		},
		numbers: {
			title: 'Numbers',
			slug: 'numbers',
			description: 'Random numbers on a grid. You can add and remove widgets.',
			href: '/examples/numbers'
		}
	};
</script>

<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import LayoutPanelLeft from 'lucide-svelte/icons/layout-panel-left';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data, children } = $props();

	$effect(() => {
		document.title = `${pages[data.slug].title} ⋅ Examples ⋅ Flexiboards`;
	});
</script>

<h1 class="mb-2 text-2xl font-semibold lg:mb-4 lg:text-5xl">Examples</h1>
<h2 class="mb-8 text-base text-muted-foreground lg:text-2xl">
	See Flexiboards in action. Examples built with shadcn-svelte and Tailwind CSS.
</h2>

<div class="mb-4 hidden flex-col items-center justify-between gap-4 lg:flex lg:flex-row lg:gap-16">
	<Tabs.Root value={data.slug}>
		<Tabs.List>
			{#each Object.values(pages) as page}
				<Tabs.Trigger value={page.slug}>
					{#snippet child({ props })}
						<a href={page.href} {...props}>{page.title}</a>
					{/snippet}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>

	<Button
		href={`https://github.com/Blakintosh/svelte-flexiboards/tree/main/site/src/routes/examples/${data.slug}`}
		target="_blank"
		rel="noopener noreferrer"
		variant={'secondary'}>View source code</Button
	>
</div>

<div class="hidden w-[1440px] divide-y overflow-clip rounded-lg border lg:block">
	<div class="relative hidden aspect-video min-h-0 w-full items-stretch overflow-clip lg:flex">
		{@render children?.()}
	</div>
	<div class="bg-muted px-4 py-2 text-center text-sm [&_a]:underline">
		<span class="font-semibold">{pages[data.slug].title}:</span>
		{@html pages[data.slug].description}
	</div>
</div>
<!-- Temporary placeholder for mobile -->
<div
	class="grid aspect-video w-full place-items-center rounded-lg border py-4 text-center text-sm text-muted-foreground lg:hidden"
>
	<div class="flex flex-col items-center gap-2 px-8">
		<LayoutPanelLeft class="size-12" />
		Mobile-friendly demos are coming soon. Please check back on a large screen, if able.
	</div>
</div>
