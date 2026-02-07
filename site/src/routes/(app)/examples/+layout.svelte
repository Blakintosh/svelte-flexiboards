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
			description: `A drag-and-drop SaaS dashboard. Built with code from <a href="https://next.shadcn-svelte.com/examples/dashboard" target="_blank" rel="noopener noreferrer">shadcn-svelte's Dashboard Example</a> and LayerChart.`,
			href: '/examples/dashboard'
		},
		notes: {
			title: 'Notes',
			slug: 'notes',
			description: 'A popular note-taking app.',
			href: '/examples/notes'
		},
		flexspressive: {
			title: 'Flexspressive',
			slug: 'flexspressive',
			description: 'All your quick settings.',
			href: '/examples/flexspressive'
		},
		products: {
			title: 'Products',
			slug: 'products',
			description: 'An e-commerce product grid with 2D flow layout.',
			href: '/examples/products'
		},
		numbers: {
			title: 'Numbers',
			slug: 'numbers',
			description: 'Random numbers on a grid. You can add and remove widgets.',
			href: '/examples/numbers'
		},
		flow: {
			title: 'Flow',
			slug: 'flow',
			description: 'A simple 2D flow layout.',
			href: '/examples/flow'
		}
	};

	type Viewport = 'desktop' | 'tablet' | 'mobile';
</script>

<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Monitor from 'lucide-svelte/icons/monitor';
	import Tablet from 'lucide-svelte/icons/tablet';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

	let { data } = $props();

	let viewport: Viewport = $state('desktop');

	const viewportWidths: Record<Viewport, string> = {
		desktop: '100%',
		tablet: '768px',
		mobile: '375px'
	};

	$effect(() => {
		document.title = `${pages[data.slug].title} - Examples - Flexiboards`;
	});
</script>

<div class="grid h-full w-full place-items-center">
	<div class="py-8">
		<h1 class="mb-2 text-2xl font-semibold lg:text-4xl 2xl:mb-4 2xl:text-5xl">Examples</h1>
		<h2 class="text-muted-foreground mb-8 text-base lg:text-xl 2xl:text-2xl">
			See Flexiboards in action. Examples built with shadcn-svelte and Tailwind CSS.
		</h2>

		<div class="mb-4 flex items-center justify-between gap-4 lg:gap-8">
			<div class="hidden lg:block">
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
			</div>

			<div class="flex items-center gap-2">
				<div class="lg:hidden">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" {...props}>
									{pages[data.slug].title}
									<ChevronDown class="ml-1 size-4" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							{#each Object.values(pages) as page}
								<a href={page.href}>
									<DropdownMenu.Item class={page.slug === data.slug ? 'bg-accent' : ''}>
										{page.title}
									</DropdownMenu.Item>
								</a>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div class="hidden items-center rounded-lg border p-1 lg:flex">
					<Button
						variant="ghost"
						size="sm"
						class="h-7 px-2.5 {viewport === 'desktop' ? 'bg-muted' : ''}"
						aria-label="Desktop view"
						aria-pressed={viewport === 'desktop'}
						onclick={() => (viewport = 'desktop')}
					>
						<Monitor class="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						class="h-7 px-2.5 {viewport === 'tablet' ? 'bg-muted' : ''}"
						aria-label="Tablet view"
						aria-pressed={viewport === 'tablet'}
						onclick={() => (viewport = 'tablet')}
					>
						<Tablet class="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						class="h-7 px-2.5 {viewport === 'mobile' ? 'bg-muted' : ''}"
						aria-label="Mobile view"
						aria-pressed={viewport === 'mobile'}
						onclick={() => (viewport = 'mobile')}
					>
						<Smartphone class="size-4" />
					</Button>
				</div>

				<Button
					href={`https://github.com/Blakintosh/svelte-flexiboards/tree/main/site/src/routes/examples/${data.slug}`}
					target="_blank"
					rel="noopener noreferrer"
					variant={'secondary'}>View source code</Button
				>
			</div>
		</div>

		<div
			class="w-full divide-y overflow-clip rounded-lg border lg:block lg:w-[75vw] xl:w-[1200px] 2xl:w-[1440px]"
		>
			<div
				class="bg-muted/30 relative flex aspect-9/18 min-h-0 w-full items-center justify-center overflow-clip lg:aspect-video"
			>
				<iframe
					src={`/embed/${data.slug}`}
					title={`${pages[data.slug].title} example`}
					class="border-border/50 bg-background h-full border-x transition-[width] duration-300 ease-in-out"
					style:width={viewportWidths[viewport]}
				></iframe>
			</div>
			<div class="bg-muted px-4 py-2 text-center text-sm [&_a]:underline">
				<span class="font-semibold">{pages[data.slug].title}:</span>
				{@html pages[data.slug].description}
			</div>
		</div>
	</div>
</div>
