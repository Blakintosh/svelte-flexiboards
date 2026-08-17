<script lang="ts">
	import { FlexiBoard, FlexiTarget, FlexiWidget } from 'svelte-flexiboards';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import FrameworkPicker from '$lib/components/brand/framework-picker.svelte';
	import InstallCommand from '$lib/components/brand/install-command.svelte';
	import SectionHeading from '$lib/components/brand/section-heading.svelte';
	import Figure from '$lib/components/brand/figure.svelte';
	import CodeListing from '$lib/components/brand/code-listing.svelte';
	import { framework } from '$lib/components/brand/framework.svelte';

	$effect(() => {
		document.title = 'Flexiboards — headless drag & drop grids';
	});

	// The Svelte adapter names the target key `key`; the React one `flexiKey`.
	const targetKeyProp = $derived(framework.current === 'svelte' ? 'key' : 'flexiKey');

	const kanbanListing = $derived(`<FlexiBoard config={{ targetDefaults: { layout: { type: 'flow', flowAxis: 'column' } } }}>
  <FlexiTarget ${targetKeyProp}="todo">
    <FlexiWidget draggable>Study for exam</FlexiWidget>
    <FlexiWidget draggable>Research project</FlexiWidget>
  </FlexiTarget>
  <FlexiTarget ${targetKeyProp}="done">
    <FlexiWidget draggable>Feed the cat</FlexiWidget>
  </FlexiTarget>
</FlexiBoard>`);

	const targetSnippet = `layout: { type: 'free',\n  minColumns: 4 }`;

	const grids = [
		{
			eyebrow: "layout.type = 'free'",
			title: 'Free-form',
			body: 'Sparse coordinates, min and max rows and columns, resize handles, collision resolution and collapsing empty tracks. This is your dashboard.'
		},
		{
			eyebrow: "layout.type = 'flow'",
			title: 'Flow',
			body: 'Ordered rows or columns with append or prepend placement. Kanban, sortable lists, playlists — same widgets, same board.'
		},
		{
			eyebrow: 'ResponsiveFlexiBoard',
			title: 'Per breakpoint',
			body: 'Each breakpoint owns its arrangement and persists it. A desktop dashboard and its phone layout stop fighting each other.'
		}
	];

	const extras = [
		{
			title: 'Multiple targets',
			body: 'Drag between any targets in a board — free-form into flow included.'
		},
		{
			title: 'Adders & deleters',
			body: 'Spawn widgets by dragging from a palette; drop onto a bin to remove.'
		},
		{
			title: 'Export & import',
			body: 'Serialise a board to JSON, hydrate it back. Layouts survive reloads.'
		}
	];

	const packages = [
		{
			kind: 'Engine',
			name: '@flexiboards/core',
			body: 'Placement, collision, resizing, collapse, responsive state, announcer, portalling.',
			status: null
		},
		{
			kind: 'Adapter',
			name: '@flexiboards/svelte',
			body: 'Svelte 5 runes throughout. The reference implementation, shipping today.',
			status: { label: 'stable', variant: 'default' as const }
		},
		{
			kind: 'Adapter',
			name: '@flexiboards/react',
			body: 'Core signals bridged into React via useSyncExternalStore. Usable, API not yet frozen.',
			status: { label: 'preview', variant: 'accent' as const }
		},
		{
			kind: 'Adapter',
			name: '@flexiboards/vue',
			body: "Vue's refs map onto the same façade. Interested? The issue tracker is the place to say so.",
			status: { label: 'planned', variant: 'outline' as const }
		}
	];

	// Each thumbnail is the arrangement its example demonstrates, drawn as cells.
	// `moving` marks the one widget in motion — the dashed vermillion frame.
	const examples = [
		{
			href: '/examples/dashboard',
			title: 'Dashboard',
			meta: 'free · resizable',
			thumb: {
				columns: 3,
				rows: 2,
				cells: [
					{ col: '1 / span 2', row: '1' },
					{ col: '3', row: '1' },
					{ col: '1', row: '2', moving: true },
					{ col: '2 / span 2', row: '2' }
				]
			}
		},
		{
			href: '/examples/flow',
			title: 'Kanban',
			meta: 'flow · multi-target',
			thumb: {
				columns: 3,
				rows: 3,
				cells: [
					{ col: '1', row: '1' },
					{ col: '1', row: '2' },
					{ col: '2', row: '1', moving: true },
					{ col: '3', row: '1' },
					{ col: '3', row: '2' },
					{ col: '3', row: '3' }
				]
			}
		},
		{
			href: '/examples/notes',
			title: 'Notes',
			meta: 'free · adder',
			thumb: {
				columns: 2,
				rows: 2,
				cells: [
					{ col: '1', row: '1' },
					{ col: '2', row: '1 / span 2' },
					{ col: '1', row: '2', moving: true }
				]
			}
		},
		{
			href: '/examples/products',
			title: 'Products',
			meta: 'responsive · export',
			thumb: {
				columns: 4,
				rows: 2,
				cells: [
					{ col: '1', row: '1' },
					{ col: '2', row: '1' },
					{ col: '3', row: '1', moving: true },
					{ col: '4', row: '1' },
					{ col: '1 / span 4', row: '2' }
				]
			}
		}
	];
</script>

<!-- ===== HERO ===== -->
<section
	class="graph-paper page-gutter grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-14 pb-18 pt-20"
>
	<div class="flex flex-col gap-6 self-center">
		<p class="label m-0 text-xs tracking-[0.16em] text-vermillion">Headless drag &amp; drop grids</p>
		<h1 class="m-0 font-serif text-[42px] leading-[1.02] tracking-[-0.02em] sm:text-[52px] lg:text-[62px]">
			We'll bring the grid.<br />You bring the style.
		</h1>
		<p class="m-0 max-w-[520px] text-lg leading-relaxed text-body">
			Flexiboards — a headless drag-and-drop engine. Free-form dashboards, flow columns,
			resizing, collision, collapse, per-breakpoint layouts. Headless by design; you decide how
			it looks.
		</p>

		<div class="flex max-w-[520px] flex-col">
			<div class="mb-2 flex items-center gap-2.5">
				<span class="label text-[10px] tracking-[0.16em] text-faint">Framework</span>
				<div class="h-px flex-1 bg-rule"></div>
			</div>
			<FrameworkPicker class="border-b-0" />
			<InstallCommand command={`npm i ${framework.meta.package}`} />
			<div class="mt-4 flex flex-wrap gap-3">
				<Button href="/docs">Read the docs</Button>
				<Button href="/examples" variant="outline">See examples</Button>
			</div>
		</div>

		<div
			class="flex flex-wrap gap-x-7 gap-y-2 border-t border-rule pt-4 font-mono text-xs text-body"
		>
			<span>MIT licensed</span>
			<span>Powered by signals</span>
			<span>Zero styling shipped</span>
			<span>Accessibility-ready</span>
		</div>
	</div>

	<!--
		The hero board is the real component, not a mock — the grid is the artwork,
		and a drag-and-drop library should let you drag on its own front page.
	-->
	<Figure caption="Fig 1 · free-form target · 4 × 3" note="drag a widget" class="self-start">
		<FlexiBoard>
			<FlexiTarget
				config={{
					layout: { type: 'free', minRows: 3, minColumns: 4, maxColumns: 4 },
					rowSizing: '72px'
				}}
				class="gap-2.5"
			>
				<FlexiWidget
					draggable
					x={0}
					y={0}
					width={2}
					class="flex h-full w-full items-end justify-between border border-blue bg-tint p-2 font-mono text-[10px] text-blue"
				>
					revenue<span>2×1</span>
				</FlexiWidget>
				<FlexiWidget
					draggable
					x={2}
					y={0}
					width={2}
					height={2}
					class="flex h-full w-full items-end justify-between border border-blue bg-tint p-2 font-mono text-[10px] text-blue"
				>
					sessions<span>2×2</span>
				</FlexiWidget>
				<FlexiWidget
					draggable
					x={0}
					y={1}
					class="flex h-full w-full items-end border border-dashed border-vermillion bg-tint-accent p-2 font-mono text-[10px] text-vermillion"
				>
					grab me
				</FlexiWidget>
				<FlexiWidget
					draggable
					x={0}
					y={2}
					width={4}
					class="flex h-full w-full items-end justify-between border border-blue bg-tint p-2 font-mono text-[10px] text-blue"
				>
					activity<span>4×1</span>
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>

		<div class="mt-4.5 flex items-center gap-2 font-mono text-[10px] text-faint">
			<div class="h-px flex-1 bg-rule"></div>
			<span>column sizing · minmax(0, 1fr)</span>
			<div class="h-px flex-1 bg-rule"></div>
		</div>

		<div class="mt-4 grid grid-cols-3 gap-2">
			{#each [{ label: 'Keyboard', value: 'Space to grab' }, { label: 'Announcer', value: 'Live region' }, { label: 'Breakpoint', value: 'lg · 1024' }] as cell (cell.label)}
				<div class="label border border-rule px-2.5 py-2.5 text-[9.5px] tracking-[0.12em] text-faint">
					{cell.label}
					<div class="mt-1 font-mono text-xs normal-case tracking-normal text-ink">{cell.value}</div>
				</div>
			{/each}
		</div>
	</Figure>
</section>

<!-- ===== §02 ONE ENGINE ===== -->
<section class="page-gutter border-t border-rule bg-panel py-16">
	<SectionHeading number="02" class="mb-8">One engine, three grids</SectionHeading>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] border border-rule">
		{#each grids as grid, i (grid.title)}
			<div class="p-6.5 {i < grids.length - 1 ? 'border-b border-rule lg:border-b-0 lg:border-r' : ''}">
				<p class="m-0 mb-2.5 font-mono text-[11px] text-vermillion">{grid.eyebrow}</p>
				<h3 class="m-0 mb-2 font-serif text-[19px]">{grid.title}</h3>
				<p class="m-0 text-[14.5px] leading-relaxed text-body">{grid.body}</p>
			</div>
		{/each}
	</div>
	<div
		class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] border border-t-0 border-rule"
	>
		{#each extras as extra, i (extra.title)}
			<div class="px-6.5 py-5.5 {i < extras.length - 1 ? 'border-b border-rule lg:border-b-0 lg:border-r' : ''}">
				<h3 class="m-0 mb-1.5 font-serif text-[17px]">{extra.title}</h3>
				<p class="m-0 text-sm leading-relaxed text-body">{extra.body}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ===== §03 CODE + RESULT ===== -->
<!-- The ink and paper halves must still meet edge to edge, so the measure is
     capped on a wrapper rather than as section padding. -->
<section class="border-t border-rule">
	<div class="page-inner grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))]">
		<CodeListing
			caption="Listing 1 · a kanban board"
			lang={framework.meta.label + (framework.meta.status === 'preview' ? ' (preview)' : '')}
			source={kanbanListing}
			class="px-6 py-11 lg:px-10"
		>
			{#if framework.current === 'react'}
				<p class="m-0 mt-4.5 border-l-2 border-vermillion bg-white/5 px-3 py-2 text-xs text-on-ink">
					Preview API — component names and props match the Svelte adapter; details may still move
					before 1.0 of <span class="text-white">@flexiboards/react</span>.
				</p>
			{/if}
		</CodeListing>

		<div class="border-t border-rule bg-paper px-6 py-11 lg:border-l lg:border-t-0 lg:px-10">
			<div class="label mb-4.5 text-[11px] text-faint">Result · styled entirely by you</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="border border-rule bg-panel p-3.5">
					<div class="mb-3 font-serif text-[15px]">Incomplete</div>
					<div class="flex flex-col gap-2">
						<div class="border border-blue bg-tint px-3 py-2.5 text-[13.5px]">Study for exam</div>
						<div
							class="border border-dashed border-vermillion bg-tint-accent px-3 py-2.5 text-[13.5px] text-vermillion"
						>
							Research project
						</div>
					</div>
				</div>
				<div class="border border-rule bg-panel p-3.5">
					<div class="mb-3 font-serif text-[15px]">Done</div>
					<div class="flex flex-col gap-2">
						<div class="border border-blue bg-tint px-3 py-2.5 text-[13.5px]">Feed the cat</div>
						<div class="border border-blue bg-tint px-3 py-2.5 text-[13.5px] opacity-50">
							Recharge car
						</div>
					</div>
				</div>
			</div>
			<p class="m-0 mt-5 max-w-[460px] text-[14.5px] leading-relaxed text-body">
				Flexiboards renders no styles of its own. Every border and colour above is ordinary CSS in
				the host app.
			</p>
		</div>
	</div>
</section>

<!-- ===== §04 ONE CORE, ONE ADAPTER PER FRAMEWORK ===== -->
<section class="page-gutter border-t border-rule bg-panel py-16">
	<SectionHeading number="04" class="mb-2.5">One core, one adapter per framework</SectionHeading>
	<p class="m-0 mb-7 max-w-[720px] text-base leading-relaxed text-body">
		The grid engine lives in <code class="font-mono text-[14.5px]">@flexiboards/core</code> and
		reads its reactivity through a signals façade. Each framework package is a thin adapter over
		the same engine — so behaviour doesn't fork per framework.
	</p>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] border border-rule">
		{#each packages as pkg, i (pkg.name)}
			<div
				class="p-6 {i % 3 === 0 ? 'bg-paper' : ''} {i < packages.length - 1
					? 'border-b border-rule lg:border-b-0 lg:border-r'
					: ''}"
			>
				<div class="mb-2.5 flex items-center justify-between gap-3">
					<span class="label text-[10.5px] text-faint">{pkg.kind}</span>
					{#if pkg.status}
						<Badge variant={pkg.status.variant}>{pkg.status.label}</Badge>
					{/if}
				</div>
				<h3 class="m-0 mb-1.5 font-serif text-lg">{pkg.name}</h3>
				<p class="m-0 text-sm leading-relaxed text-body">{pkg.body}</p>
			</div>
		{/each}
	</div>
</section>

<!-- ===== §05 QUICKSTART ===== -->
<section class="graph-paper page-gutter border-t border-rule bg-paper py-16">
	<SectionHeading number="05" class="mb-7">Three steps to a board</SectionHeading>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-5">
		<div class="border border-ink bg-panel p-6">
			<div class="label mb-3 text-[11px] text-vermillion">Step 01</div>
			<h3 class="m-0 mb-2.5 font-serif text-[19px]">Install</h3>
			<div class="bg-field px-3 py-2.5 font-mono text-[13px] text-on-ink">
				npm i {framework.meta.package}
			</div>
		</div>
		<div class="border border-ink bg-panel p-6">
			<div class="label mb-3 text-[11px] text-vermillion">Step 02</div>
			<h3 class="m-0 mb-2.5 font-serif text-[19px]">Declare a target</h3>
			<pre
				class="m-0 bg-field px-3 py-2.5 font-mono text-[13px] leading-[1.7] text-on-ink">{targetSnippet}</pre>
		</div>
		<div class="border border-ink bg-panel p-6">
			<div class="label mb-3 text-[11px] text-vermillion">Step 03</div>
			<h3 class="m-0 mb-2.5 font-serif text-[19px]">Style your widgets</h3>
			<p class="m-0 text-[14.5px] leading-relaxed text-body">
				Any markup, any CSS framework. Flexiboards only sets position and drag behaviour.
			</p>
		</div>
	</div>
</section>

<!-- ===== §06 EXAMPLES ===== -->
<section class="page-gutter border-t border-rule bg-panel py-16">
	<div class="mb-6 flex flex-wrap items-baseline justify-between gap-4">
		<SectionHeading number="06">Built with Flexiboards</SectionHeading>
		<Button href="/examples" variant="link">All examples</Button>
	</div>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
		{#each examples as example (example.href)}
			<a
				href={example.href}
				class="border border-rule bg-paper p-4 transition-colors duration-[120ms] hover:border-ink"
			>
				<!--
					Thumbnails are boards, drawn as cells: never stock imagery. Each
					one is the arrangement that example actually demonstrates, with a
					dashed vermillion cell marking the widget in motion.
				-->
				<div
					class="mb-3.5 grid h-[74px] gap-1.5"
					style="grid-template-columns:repeat({example.thumb.columns},1fr); grid-template-rows:repeat({example.thumb
						.rows},1fr)"
				>
					{#each example.thumb.cells as cell, i (i)}
						<div
							class={cell.moving
								? 'border border-dashed border-vermillion bg-tint-accent'
								: 'border border-rule bg-tint'}
							style="grid-column:{cell.col}; grid-row:{cell.row}"
						></div>
					{/each}
				</div>
				<div class="mb-1 font-serif text-base">{example.title}</div>
				<div class="label text-[10.5px] tracking-[0.12em] text-faint">{example.meta}</div>
			</a>
		{/each}
	</div>
</section>

<!-- ===== SUPPORT CTA — the one vermillion band on the page ===== -->
<section
	class="page-gutter flex flex-wrap items-center justify-between gap-8 border-t border-ink bg-vermillion py-11 text-white"
>
	<div>
		<h2 class="m-0 mb-1.5 font-serif text-[26px]">Support the development of Flexiboards</h2>
		<p class="m-0 text-[15px] opacity-90">Any support is appreciated.</p>
	</div>
	<!-- Vermillion is the one colour that doesn't invert, so nothing inside the
	     CTA band may either: `bg-field`, not `bg-ink`. -->
	<div class="flex flex-wrap gap-3">
		<a
			href="https://github.com/blakintosh/svelte-flexiboards"
			target="_blank"
			class="label bg-field px-5 py-3.5 text-[13px] tracking-[0.06em] text-white transition-colors duration-[120ms] hover:bg-field/85"
		>
			Star on GitHub
		</a>
		<a
			href="https://github.com/sponsors/Blakintosh"
			target="_blank"
			class="label border border-white px-5 py-3.5 text-[13px] tracking-[0.06em] transition-colors duration-[120ms] hover:bg-white hover:text-vermillion"
		>
			Sponsor
		</a>
	</div>
</section>
