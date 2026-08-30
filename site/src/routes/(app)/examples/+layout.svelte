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
		},
		kanban: {
			title: 'Kanban',
			slug: 'kanban',
			description:
				'A sprint board. Cards move between four flow targets; the column headings are a second, independent board.',
			href: '/examples/kanban'
		},
		'form-builder': {
			title: 'Form Builder',
			slug: 'form-builder',
			description:
				'A drag-and-drop form builder. Fields carry their settings as widget metadata, exported live as JSON.',
			href: '/examples/form-builder'
		},
		compound: {
			title: 'Compound',
			slug: 'compound',
			description:
				'Nested boards. Tiles that are themselves boards, with every drag scoped to the board that owns it.',
			href: '/examples/compound'
		},
		gallery: {
			title: 'Gallery',
			slug: 'gallery',
			description:
				'A cyanotype plate mosaic on a free 2D grid. Resize a plate and its neighbours make room; switch between spring and CSS motion.',
			href: '/examples/gallery'
		},
		launcher: {
			title: 'Launcher',
			slug: 'launcher',
			description: 'A bento home screen that keeps a different layout at every breakpoint.',
			href: '/examples/launcher'
		},
		playlist: {
			title: 'Playlist',
			slug: 'playlist',
			description: 'A keyboard-first sortable list: one flow target, one grab handle per row.',
			href: '/examples/playlist'
		}
	};

	type Viewport = 'desktop' | 'tablet' | 'mobile';
</script>

<script lang="ts">
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

	/* Dimensions are labels, so the frame annotates itself in mono. */
	const viewportLabels: Record<Viewport, string> = {
		desktop: 'desktop · fluid',
		tablet: 'tablet · 768px',
		mobile: 'mobile · 375px'
	};

	const viewports: { id: Viewport; icon: typeof Monitor; label: string }[] = [
		{ id: 'desktop', icon: Monitor, label: 'Desktop view' },
		{ id: 'tablet', icon: Tablet, label: 'Tablet view' },
		{ id: 'mobile', icon: Smartphone, label: 'Mobile view' }
	];

	$effect(() => {
		document.title = `${pages[data.slug].title} - Examples - Flexiboards`;
	});
</script>

<div class="graph-paper bg-paper grid h-full w-full place-items-center">
	<div class="py-10">
		<span class="label text-fx-accent text-[11px]">Examples</span>
		<h1 class="text-ink mt-3 font-serif text-[30px] 2xl:text-[38px]">Flexiboards in action</h1>
		<p class="text-body mt-3 mb-10 max-w-[68ch]">
			Twelve boards, each running the real library. Built with shadcn-svelte and Tailwind CSS.
		</p>

		<div class="mb-4 flex items-end justify-between gap-4 lg:gap-8">
			<!-- Example switcher: the active sheet takes a fx-accent rule, not a fill. -->
			<nav class="hidden lg:block" aria-label="Examples">
				<ul class="border-rule flex flex-wrap items-center gap-x-6 border-b">
					{#each Object.values(pages) as page}
						<li>
							<a
								href={page.href}
								aria-current={page.slug === data.slug ? 'page' : undefined}
								class="ui -mb-px block border-b py-2 text-xs transition-colors duration-[120ms] {page.slug ===
								data.slug
									? 'border-fx-accent text-ink'
									: 'text-faint hover:text-ink border-transparent'}"
							>
								{page.title}
							</a>
						</li>
					{/each}
				</ul>
			</nav>

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
									<DropdownMenu.Item
										class={page.slug === data.slug ? 'bg-tint text-fx-accent' : ''}
									>
										{page.title}
									</DropdownMenu.Item>
								</a>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				<div class="border-ink hidden items-center border lg:flex">
					{#each viewports as option (option.id)}
						<Button
							variant="ghost"
							size="sm"
							class="h-8 px-3 {viewport === option.id ? 'bg-tint text-ink' : ''}"
							aria-label={option.label}
							aria-pressed={viewport === option.id}
							onclick={() => (viewport = option.id)}
						>
							<option.icon class="size-4" />
						</Button>
					{/each}
				</div>

				<Button
					href={`https://github.com/Blakintosh/svelte-flexiboards/tree/main/site/src/lib/components/examples/pages`}
					target="_blank"
					rel="noopener noreferrer"
					size="sm"
					variant={'outline'}>View source</Button
				>
			</div>
		</div>

		<!-- The board itself is the figure: ink frame, mono caption tab, no radius. -->
		<div
			class="border-ink bg-panel w-full border lg:block lg:w-[75vw] xl:w-[1200px] 2xl:w-[1440px]"
		>
			<div class="border-rule bg-paper flex items-center justify-between border-b px-3 py-2">
				<span class="label text-faint text-[10px]">
					Fig 1 · {pages[data.slug].title.toLowerCase()} · {viewportLabels[viewport]}
				</span>
				<span class="text-faint font-mono text-[10px]">/embed/svelte/{data.slug}</span>
			</div>
			<div
				class="bg-tint-2 relative flex aspect-9/18 min-h-0 w-full items-center justify-center overflow-clip lg:aspect-video"
			>
				<iframe
					src={`/embed/svelte/${data.slug}`}
					title={`${pages[data.slug].title} example`}
					class="ease-snap border-rule bg-paper h-full border-x transition-[width] duration-300"
					style:width={viewportWidths[viewport]}
				></iframe>
			</div>
			<div
				class="border-rule bg-paper text-body [&_a]:border-rule [&_a]:text-ink [&_a:hover]:border-fx-accent [&_a:hover]:text-fx-accent border-t px-4 py-2.5 text-center text-[13px] [&_a]:border-b"
			>
				<span class="label text-faint mr-2 text-[10px]">{pages[data.slug].title}</span>
				{@html pages[data.slug].description}
			</div>
		</div>
	</div>
</div>
