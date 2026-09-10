<script module lang="ts">
	import type { Framework } from '$lib/components/brand/framework.svelte';

	type ExamplePage = {
		title: string;
		slug: string;
		description: string;
		href: string;
	};

	type ExampleGroup = {
		heading: string;
		slugs: string[];
	};

	const pages: Record<string, ExamplePage> = {
		dashboard: {
			title: 'Dashboard',
			slug: 'dashboard',
			description: 'A drag-and-drop SaaS dashboard with an editable, responsive layout that persists between visits.',
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

	// The sidebar groups examples by the layout system they demonstrate.
	const groups: ExampleGroup[] = [
		{
			heading: 'Free grid',
			slugs: ['dashboard', 'notes', 'flexspressive', 'numbers', 'gallery', 'launcher']
		},
		{ heading: 'Flow', slugs: ['products', 'flow', 'kanban', 'form-builder', 'playlist'] },
		{ heading: 'Nested', slugs: ['compound'] }
	];

	type Viewport = 'desktop' | 'tablet' | 'mobile';

	/*
	  "Features used" rail. Each feature links to the doc that explains it, so
	  the rail doubles as the path from "that looks useful" to "how do I do it".
	  Grouped so the rail reads as layout → interaction → state → motion.
	*/
	type Feature = {
		label: string;
		/** Docs link, or per-framework links (null = no relevant page, chip has no link). */
		href: string | Record<Framework, string | null>;
		group: 'Layout' | 'Interaction' | 'State' | 'Motion';
	};

	const features = {
		freeGrid: { label: 'Free grid', href: '/docs/free-form-grids', group: 'Layout' },
		flowGrid: { label: 'Flow grid', href: '/docs/flow-grids', group: 'Layout' },
		packing: { label: 'Packing', href: '/docs/free-form-grids', group: 'Layout' },
		multiTarget: { label: 'Multiple targets', href: '/docs/multiple-targets', group: 'Layout' },
		nested: { label: 'Nested boards', href: '/docs/multiple-targets', group: 'Layout' },
		registry: { label: 'Widget registry', href: '/docs/widget-rendering', group: 'Layout' },
		grab: { label: 'Grab handles', href: '/docs/components/widget', group: 'Interaction' },
		resize: { label: 'Resizing', href: '/docs/components/widget', group: 'Interaction' },
		keyboard: { label: 'Keyboard', href: '/docs/components/widget', group: 'Interaction' },
		adder: { label: 'Adding widgets', href: '/docs/components/adder', group: 'Interaction' },
		deleter: { label: 'Deleting widgets', href: '/docs/components/deleter', group: 'Interaction' },
		editMode: { label: 'Edit mode', href: '/docs/configuration', group: 'Interaction' },
		metadata: { label: 'Widget metadata', href: '/docs/widget-rendering', group: 'State' },
		stored: { label: 'Stored layouts', href: '/docs/guides/exporting-importing-boards', group: 'State' },
		export: { label: 'Export as JSON', href: '/docs/guides/exporting-importing-boards', group: 'State' },
		responsive: { label: 'Responsive layouts', href: '/docs/guides/responsive-layouts', group: 'State' },
		spring: { label: 'Spring motion', href: '/docs/transitions', group: 'Motion' },
		css: { label: 'CSS transitions', href: '/docs/transitions', group: 'Motion' },
		simple: { label: 'Simple transitions', href: '/docs/transitions', group: 'Motion' },
		ssr: { label: 'Server-side rendering', href: '/docs/guides/server-side-rendering', group: 'State' },
		// The SSR guide is Svelte-only; React has no page to send this chip to.
		csr: {
			label: 'Client-side rendering',
			href: { svelte: '/docs/guides/server-side-rendering', react: null },
			group: 'State'
		},
		// Only meaningful alongside `ssr`: the server renders a stand-in (stored
		// layout or breakpoint guess) and the real board lands after mount.
		loadOnMount: { label: 'Loads on mount', href: '/docs/guides/server-side-rendering', group: 'State' }
	} satisfies Record<string, Feature>;

	type FeatureId = keyof typeof features;
	const featureGroups: Feature['group'][] = ['Layout', 'Interaction', 'State', 'Motion'];

	// Filled from each example's source; keep in step when an example changes.
	const exampleFeatures: Record<string, FeatureId[]> = {
		dashboard: ['freeGrid', 'registry', 'grab', 'resize', 'editMode', 'metadata', 'stored', 'responsive', 'simple'],
		notes: ['flowGrid', 'multiTarget', 'grab', 'keyboard', 'simple'],
		flexspressive: ['freeGrid', 'resize', 'keyboard', 'css'],
		products: ['flowGrid', 'multiTarget', 'grab', 'resize', 'responsive', 'css', 'loadOnMount'],
		numbers: ['freeGrid', 'adder', 'deleter', 'resize', 'keyboard', 'spring'],
		flow: ['flowGrid', 'keyboard', 'css'],
		kanban: ['flowGrid', 'multiTarget', 'deleter', 'metadata', 'stored', 'export', 'css', 'loadOnMount'],
		'form-builder': ['flowGrid', 'adder', 'deleter', 'grab', 'metadata', 'stored', 'css', 'loadOnMount'],
		compound: ['freeGrid', 'flowGrid', 'nested', 'registry', 'grab', 'stored', 'css'],
		gallery: ['freeGrid', 'packing', 'resize', 'metadata', 'stored', 'responsive', 'spring', 'css', 'loadOnMount'],
		launcher: ['freeGrid', 'metadata', 'stored', 'export', 'responsive', 'css', 'loadOnMount'],
		playlist: ['flowGrid', 'grab', 'keyboard', 'stored', 'css']
	};
</script>

<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Monitor from 'lucide-svelte/icons/monitor';
	import Tablet from 'lucide-svelte/icons/tablet';
	import Smartphone from 'lucide-svelte/icons/smartphone';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { framework } from '$lib/components/brand/framework.svelte';
	import { SiSvelte, SiReact } from '@icons-pack/svelte-simple-icons';
	import { reactSlugs, ssrSlugs } from '../../(embed)/embed/shared';
	import { goto } from '$app/navigation';

	let { data, children } = $props();

	/*
	  The header's framework choice picks which embed runs. Examples without a
	  React port stay in the index but greyed out, and landing on one (deep link,
	  or switching frameworks while viewing it) sends you to the first ported
	  example in sidebar order instead.
	*/
	const fw = $derived(framework.current);
	const ported = (slug: string, framework: Framework = fw) =>
		framework === 'svelte' || reactSlugs.includes(slug);
	const embedFramework = $derived(ported(data.slug) ? fw : 'svelte');

	$effect(() => {
		// Track `selected` so the redirect fires on the click, not after the dissolve.
		const chosen = framework.selected;
		if (!framework.hydrated || ported(data.slug, chosen)) return;
		const first = groups.flatMap((g) => g.slugs).find((slug) => ported(slug, chosen));
		if (first) goto(pages[first].href, { replaceState: true });
	});
	// The icon marks the framework actually on stage, so a Svelte fallback shows Svelte.
	// Brand colours (same as the header's framework menu), not the site accent —
	// so a Svelte fallback in React mode still reads as Svelte orange.
	const BRAND: Record<Framework, { icon: typeof SiSvelte; color: string }> = {
		svelte: { icon: SiSvelte, color: '#ff3e00' },
		react: { icon: SiReact, color: '#087ea4' }
	};
	const EmbedIcon = $derived(BRAND[embedFramework].icon);
	const phase = $derived(framework.swap);
	const phased = $derived(phase === 'out' ? 'swap-out' : phase === 'in' ? 'swap-in' : '');
	const sourceHref = $derived(
		fw === 'react'
			? 'https://github.com/Blakintosh/svelte-flexiboards/tree/main/site/src/lib/react-components/examples/pages'
			: 'https://github.com/Blakintosh/svelte-flexiboards/tree/main/site/src/lib/components/examples/pages'
	);

	let viewport: Viewport = $state('desktop');

	// Pressing a feature chip flags every example in the sidebar that uses it —
	// the useful half of a comparison matrix, without building one.
	let highlight: FeatureId | null = $state(null);
	const usesHighlight = (slug: string) =>
		highlight !== null &&
		(highlight === 'ssr'
			? ssrOn(slug)
			: highlight === 'csr'
				? !ssrOn(slug)
				: exampleFeatures[slug]?.includes(highlight) && (highlight !== 'loadOnMount' || ssrOn(slug)));
	// SSR is an embed-level opt-in (ssrSlugs), not something the example's
	// source declares, and React embeds never server-render.
	const ssrOn = (slug: string) => fw === 'svelte' && ssrSlugs.includes(slug);
	const featureHref = (id: FeatureId): string | null => {
		const href = features[id].href;
		return typeof href === 'string' ? href : href[fw];
	};
	const currentFeatures = $derived([
		...(exampleFeatures[data.slug] ?? []).filter((id) => id !== 'loadOnMount' || ssrOn(data.slug)),
		(ssrOn(data.slug) ? 'ssr' : 'csr') as FeatureId
	]);

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

<div class="mx-auto flex w-full max-w-[100rem] flex-1 gap-7 py-8">
	<!-- Sidebar: grouped index. The active example is a lifted white pill with an accent dot. -->
	<aside class="hidden w-[212px] shrink-0 flex-col gap-6 lg:flex">
		<div class="flex flex-col gap-1.5">
			<span class="label text-fx-accent text-[11px]">Examples</span>
			<h1 class="text-ink m-0 font-serif text-2xl leading-[1.15] font-semibold">
				Flexiboards in action
			</h1>
			<p class="text-faint m-0 text-[12.5px] leading-[1.55]">
				Twelve boards, each running the real library.
			</p>
		</div>

		{#each groups as group (group.heading)}
			<nav class="flex flex-col gap-1" aria-label={group.heading}>
				<span class="text-faint px-2.5 pb-1 text-[11px] font-bold">{group.heading}</span>
				{#each group.slugs as slug (slug)}
					{@const page = pages[slug]}
					{@const available = ported(slug)}
					<a
						href={available ? page.href : undefined}
						aria-current={slug === data.slug ? 'page' : undefined}
						aria-disabled={available ? undefined : true}
						title={available ? undefined : 'Not ported to React yet'}
						class="flex items-center justify-between rounded-[10px] px-3 py-[7px] text-[13px] transition-colors duration-[120ms] {slug ===
						data.slug
							? 'bg-panel border-rule-soft text-ink border font-bold shadow-[0_1px_3px_rgba(16,32,46,0.06)]'
							: available
								? 'text-body hover:bg-rule-faint hover:text-ink font-semibold'
								: 'text-faint/60 cursor-not-allowed font-semibold'}"
					>
						{page.title}
						{#if slug === data.slug}
							<span class="bg-fx-accent size-1.5 rounded-full"></span>
						{:else if usesHighlight(slug)}
							<span class="bg-blue size-1.5 rounded-full" title="Uses {highlight ? features[highlight].label : ''}"></span>
						{/if}
					</a>
				{/each}
			</nav>
		{/each}

		{#if fw === 'react'}
			<p
				class="border-rule-soft bg-tint text-body mt-auto rounded-[10px] border px-3 py-2.5 text-[14px] leading-[1.5]"
				role="note"
			>
				<code>@flexiboards/react</code> is in public preview. We'll add more React examples as we approach stability.
			</p>
		{/if}
	</aside>

	<!-- Viewer: one rounded card — toolbar on top, recessed stage below. -->
	<div class="flex min-w-0 flex-1 flex-col">
		<div
			class="border-rule-soft bg-panel shadow-card-lg flex flex-1 flex-col overflow-hidden rounded-[16px] border"
		>
			<div
				class="border-rule-faint flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3 lg:px-[18px]"
			>
				<div class="lg:hidden">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" class="rounded-full" {...props}>
									{pages[data.slug].title}
									<ChevronDown class="ml-1 size-4" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="rounded-[12px]">
							{#each Object.values(pages) as page (page.slug)}
								{@const available = ported(page.slug)}
								<a href={available ? page.href : undefined}>
									<DropdownMenu.Item
										disabled={!available}
										class="rounded-[8px] {page.slug === data.slug ? 'bg-tint text-fx-accent' : ''}"
									>
										{page.title}
									</DropdownMenu.Item>
								</a>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<span
					class="text-body [&_a]:border-rule-soft [&_a]:text-ink [&_a:hover]:border-fx-accent [&_a:hover]:text-fx-accent hidden min-w-0 text-[13px] lg:inline [&_a]:border-b"
				>
					<EmbedIcon
						size={20}
						class="mr-1.5 inline-block align-[-5px] {phased}"
						color={BRAND[embedFramework].color}
						aria-label="{embedFramework === 'react' ? 'React' : 'Svelte'} example"
					/>
					<strong class="text-ink font-bold">{pages[data.slug].title}</strong>
					<span aria-hidden="true">—</span>
					{@html pages[data.slug].description}
				</span>

				<span class="flex shrink-0 items-center gap-2.5">
					<span class="text-faint/70 hidden font-mono text-[11px] md:inline">
						{viewportLabels[viewport]}
					</span>
					<span class="bg-stage hidden items-center gap-0.5 rounded-full p-[3px] lg:flex">
						{#each viewports as option (option.id)}
							<button
								type="button"
								class="flex h-[26px] w-[30px] cursor-pointer items-center justify-center rounded-full border-none transition-colors duration-[120ms] {viewport ===
								option.id
									? 'bg-panel shadow-seg text-ink'
									: 'text-faint hover:text-ink bg-transparent'}"
								aria-label={option.label}
								aria-pressed={viewport === option.id}
								onclick={() => (viewport = option.id)}
							>
								<option.icon class="size-3.5" />
							</button>
						{/each}
					</span>
					<a
						href={sourceHref}
						target="_blank"
						rel="noopener noreferrer"
						class="border-rule-soft text-body hover:bg-rule-faint inline-flex h-[30px] items-center rounded-full border px-[13px] text-xs font-semibold transition-colors duration-[120ms]"
					>
						View source
					</a>
				</span>
			</div>

			<!-- Below xl the rail folds into a chip strip; the same chips, same highlight. -->
			<div class="border-rule-faint flex flex-wrap items-center gap-1.5 border-b px-4 py-2 xl:hidden lg:px-[18px]">
				<span class="text-faint mr-1 text-[11px] font-bold">Features</span>
				{#each currentFeatures as id (id)}
					{@render chip(id)}
				{/each}
			</div>

			<div class="bg-stage flex min-h-[560px] flex-1 justify-center">
				<iframe
					src={`/embed/${embedFramework}/${data.slug}`}
					title={`${pages[data.slug].title} example`}
					class="ease-snap bg-paper h-full max-w-full transition-[width] duration-300 {phased}"
					style:width={viewportWidths[viewport]}
				></iframe>
			</div>
		</div>
	</div>

	<!-- Features rail: what this board is exercising, each linked to its doc. -->
	<aside class="hidden w-[200px] shrink-0 flex-col gap-5 xl:flex" aria-label="Features used">
		<div class="flex flex-col gap-2">
			<span class="text-[16px] font-serif font-bold">Features used</span>
			<p class="text-faint m-0 text-[13px] leading-[1.5]">
				Press one to flag other examples that use it, or navigate to the related guide if available.
			</p>
		</div>
		{#each featureGroups as group (group)}
			{@const ids = currentFeatures.filter((id) => features[id].group === group)}
			{#if ids.length}
				<div class="flex flex-col gap-1.5">
					<span class="text-faint text-[10.5px] font-semibold tracking-[0.04em] uppercase">{group}</span>
					<div class="flex flex-wrap gap-1.5">
						{#each ids as id (id)}
							{@render chip(id)}
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</aside>
</div>

{#snippet chip(id: FeatureId)}
	{@const on = highlight === id}
	{@const href = featureHref(id)}
	<span
		class="inline-flex items-stretch overflow-hidden rounded-full border text-[11.5px] font-semibold transition-colors duration-[120ms] {on
			? 'border-blue bg-tint text-blue'
			: 'border-rule-soft bg-panel text-body'}"
	>
		<button
			type="button"
			aria-pressed={on}
			class="hover:bg-rule-faint cursor-pointer px-2.5 py-1"
			onclick={() => (highlight = on ? null : id)}
		>
			{features[id].label}
		</button>
		{#if href}
			<a
				{href}
				class="border-rule-faint hover:text-fx-accent flex items-center border-l px-1.5 no-underline"
				title="Read the docs for {features[id].label}"
				aria-label="Docs: {features[id].label}"
			>
				↗
			</a>
		{/if}
	</span>
{/snippet}

<!-- Pages contribute only <svelte:head> titles; the layout draws the viewer. -->
{@render children()}
