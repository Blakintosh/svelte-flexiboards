<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		spring,
		type FlexiWidgetController,
		type FlexiWidgetTransitionConfiguration
	} from '@flexiboards/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import FrameworkPicker from '$lib/components/brand/framework-picker.svelte';
	import InstallCommand from '$lib/components/brand/install-command.svelte';
	import SectionHeading from '$lib/components/brand/section-heading.svelte';
	import CodeListing from '$lib/components/brand/code-listing.svelte';
	import FeatureTheater from '$lib/components/brand/feature-theater.svelte';
	import { framework } from '$lib/components/brand/framework.svelte';
	import { reveal } from '$lib/actions/reveal';

	// Scroll-reveal stagger between sibling cards (steps, example tiles).
	const STAGGER = 70;

	$effect(() => {
		document.title = 'Flexiboards — headless drag & drop grids';
	});

	// The Svelte adapter names the target key `key`; the React one `flexiKey`.
	const targetKeyProp = $derived(framework.current === 'svelte' ? 'key' : 'flexiKey');

	const kanbanListing =
		$derived(`<FlexiBoard config={{ targetDefaults: { layout: { type: 'flow', flowAxis: 'column' } } }}>
  <FlexiTarget ${targetKeyProp}="todo">
    <FlexiWidget draggable>Study for exam</FlexiWidget>
    <FlexiWidget draggable>Research project</FlexiWidget>
  </FlexiTarget>
  <FlexiTarget ${targetKeyProp}="done">
    <FlexiWidget draggable>Feed the cat</FlexiWidget>
  </FlexiTarget>
</FlexiBoard>`);

	const targetSnippet = `layout: { type: 'free',\n  minColumns: 4 }`;

	// The hero's "grab me" widget breathes until it's first hovered (or pressed,
	// for touch); the margin note bows out the first time any bar is grabbed.
	let heroTouched = $state(false);
	let heroHovered = $state(false);
	let heroGrabbed = $state(false);

	// springTransitionConfig(), exaggerated for the shop window: a touch more
	// bounce than an app would want, so the drop visibly *lands*.
	const heroTransition: FlexiWidgetTransitionConfiguration = {
		move: spring({ duration: 0.3, bounce: 0.1 }),
		drop: spring({ duration: 0.4, bounce: 0.25 }),
		resize: spring({ duration: 0.25, bounce: 0 })
	};

	// Every bar of the F drags. The widget element stays bare — the library
	// measures its box, so nothing scaled may live on it. All visuals and scale
	// motion sit on an inner div: the drop preview condenses in (`shadow-enter`
	// — @starting-style blur/opacity/scale); a hovered bar rises on a soft
	// shadow; a grabbed bar tilts and scales up. The dropped element remounts
	// in its resting pose — no settle animation, it flickered against the lerp.
	const heroShell = (widget: FlexiWidgetController) => [
		'h-full w-full outline-hidden',
		!widget.isShadow && 'cursor-grab active:cursor-grabbing'
	];

	// The library grabs a draggable widget on pointerdown, so a press on a real
	// bar (not its drop shadow) *is* the first grab — no events API needed.
	const onBarGrab = (widget: FlexiWidgetController) => () => {
		if (!widget.isShadow) heroGrabbed = true;
	};

	const heroBarVisual = (widget: FlexiWidgetController, base: string, pulse = false) =>
		[
			'h-full w-full rounded-[12px]',
			widget.isShadow
				? 'border-rule shadow-enter border-2 border-dashed text-transparent'
				: `${base} motion-safe:transition-[translate,rotate,scale,box-shadow,opacity,filter] motion-safe:duration-[180ms] motion-safe:ease-out`,
			// Hover only at rest: suppressed while grabbed or mid drop flight, so
			// landing under the cursor eases into the hover rise instead of
			// bouncing off the lerp.
			!widget.isShadow &&
				!widget.isGrabbed &&
				!widget.isInterpolating &&
				'hover:-translate-y-[4px] hover:shadow-[0_6px_16px_rgba(16,32,46,0.14)]',
			!widget.isShadow && widget.isGrabbed && 'shadow-lift -rotate-[2.5deg] scale-[1.045]',
			// Nowhere to land: the bar in hand greys out and flattens until the
			// pointer finds a legal spot (core swaps the cursor to not-allowed).
			!widget.isShadow && widget.dropRejected && 'rotate-0 opacity-40 saturate-0',
			pulse && !widget.isShadow && !heroTouched && !heroHovered && 'animate-fb-pulse'
		]
			.filter(Boolean)
			.join(' ');

	const packages = [
		{
			kind: 'Engine',
			name: '@flexiboards/core',
			body: 'The framework-agnostic engine that powers Flexiboards and all its interactions.',
			status: null
		},
		{
			kind: 'Adapter',
			name: '@flexiboards/svelte',
			body: 'Flexiboards for Svelte 5, built for runes. Where it all began.',
			status: { label: 'stable', variant: 'default' as const }
		},
		{
			kind: 'Adapter',
			name: '@flexiboards/react',
			body: 'Flexiboards for React, currently in public preview.',
			status: { label: 'preview', variant: 'accent' as const }
		}
	];

	// Each thumbnail is the arrangement its example demonstrates, drawn as cells.
	// `moving` marks the one widget in motion — the dashed fx-accent frame.
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
			title: 'Flow',
			meta: 'flow · 2D layout',
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
		},
		{
			href: '/examples/kanban',
			title: 'Kanban',
			meta: 'flow · nested boards',
			thumb: {
				columns: 4,
				rows: 2,
				cells: [
					{ col: '1', row: '1' },
					{ col: '1', row: '2' },
					{ col: '2', row: '1', moving: true },
					{ col: '3', row: '1' },
					{ col: '3', row: '2' },
					{ col: '4', row: '1' }
				]
			}
		},
		{
			href: '/examples/compound',
			title: 'Compound',
			meta: 'free · nested boards',
			thumb: {
				columns: 3,
				rows: 2,
				cells: [
					{ col: '1', row: '1' },
					{ col: '2 / span 2', row: '1', moving: true },
					{ col: '1 / span 2', row: '2' },
					{ col: '3', row: '2' }
				]
			}
		},
		{
			href: '/examples/gallery',
			title: 'Gallery',
			meta: 'free · resizable',
			thumb: {
				columns: 3,
				rows: 2,
				cells: [
					{ col: '1 / span 2', row: '1' },
					{ col: '3', row: '1', moving: true },
					{ col: '1', row: '2' },
					{ col: '2 / span 2', row: '2' }
				]
			}
		},
		{
			href: '/examples/launcher',
			title: 'Launcher',
			meta: 'responsive · breakpoints',
			thumb: {
				columns: 4,
				rows: 2,
				cells: [
					{ col: '1', row: '1' },
					{ col: '2', row: '1', moving: true },
					{ col: '3', row: '1' },
					{ col: '4', row: '1' },
					{ col: '1 / span 2', row: '2' },
					{ col: '3 / span 2', row: '2' }
				]
			}
		}
	];
</script>

<!-- ===== HERO ===== -->
<section
	class="graph-paper page-gutter grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] gap-14 pt-20 pb-18"
>
	<div class="flex flex-col gap-6 self-center">
		<h1
			class="animate-fb-rise m-0 font-serif text-[42px] leading-[1.02] tracking-[-0.02em] [--rise:16px] [animation-delay:120ms] sm:text-[52px] lg:text-[62px]"
		>
			We'll bring the grid.<br />You bring the style.
		</h1>
		<p
			class="animate-fb-rise text-body m-0 max-w-[520px] text-lg leading-relaxed [--rise:12px] [animation-delay:240ms]"
		>
			Flexiboards — a headless drag-and-drop engine. Free-form dashboards, flow columns, resizing,
			collision, collapse, per-breakpoint layouts. Headless by design; you decide how it looks.
		</p>

		<div class="animate-fb-rise flex max-w-[520px] flex-col [--rise:10px] [animation-delay:360ms]">
			<div class="mb-2 flex items-center gap-2.5">
				<span class="label text-faint text-[10px] tracking-[0.16em]">Framework</span>
				<div class="bg-rule h-px flex-1"></div>
			</div>
			<FrameworkPicker class="border-b-0" />
			<InstallCommand command={`npm i ${framework.meta.package}`} />
			<div class="mt-4 flex flex-wrap gap-3">
				<Button href="/docs">Read the docs</Button>
				<Button href="/examples" variant="outline">See examples</Button>
			</div>
		</div>

		<div
			class="animate-fb-rise border-rule text-body flex flex-wrap gap-x-7 gap-y-2 border-t pt-4 font-mono text-xs [--rise:0px] [animation-delay:480ms]"
		>
			<span>MIT licensed</span>
			<span>Powered by signals</span>
			<span>Zero styling shipped</span>
			<span>Accessibility-ready</span>
		</div>
	</div>

	<!--
		The hero board is the FlexiMark logo recreated as a *real* board — three
		bars of decreasing width, the moving third in the accent — because a
		drag-and-drop library should let you drag on its own front page. Only the
		accent bar is draggable; the ink and blue bars are the logo, fixed.
	-->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="animate-fb-rise relative self-start [--rise:18px] [animation-delay:280ms]"
		onpointerdowncapture={() => (heroTouched = true)}
	>
		<figure
			class="border-rule bg-panel relative mx-auto my-0 w-fit rounded-[20px] border p-8 shadow-[0_24px_56px_rgba(16,32,46,0.09)]"
		>
			<div class="relative w-[340px] max-w-full">
				<!-- Drops on the hero are often released outside its small box, so flights
					     fly in across the edge — portal them so the overflow lock can't clip them. -->
				<FlexiBoard
					config={{
						widgetDefaults: { transition: heroTransition },
						portalDropFlights: true,
						// A drag on the hero must never scroll the page under the visitor.
						autoScroll: false
					}}
				>
					<FlexiTarget
						config={{
							layout: { type: 'free', minRows: 3, maxRows: 3, minColumns: 3, maxColumns: 3 },
							rowSizing: '78px'
						}}
						class="gap-2.5"
					>
						<FlexiWidget draggable x={0} y={0} width={3} class={heroShell}>
							{#snippet children({ widget }: { widget: FlexiWidgetController })}
								<div class={heroBarVisual(widget, 'bg-ink')} onpointerdown={onBarGrab(widget)}></div>
							{/snippet}
						</FlexiWidget>
						<FlexiWidget draggable x={0} y={1} width={2} class={heroShell}>
							{#snippet children({ widget }: { widget: FlexiWidgetController })}
								<div class={heroBarVisual(widget, 'bg-blue')} onpointerdown={onBarGrab(widget)}></div>
							{/snippet}
						</FlexiWidget>
						<FlexiWidget draggable x={0} y={2} class={heroShell}>
							{#snippet children({ widget }: { widget: FlexiWidgetController })}
								<div
									class={heroBarVisual(
										widget,
										'ui bg-fx-accent flex items-center justify-center text-[12.5px] text-white',
										true
									)}
									onpointerdown={onBarGrab(widget)}
									onpointerenter={() => (heroHovered = true)}
								>
									grab me
								</div>
							{/snippet}
						</FlexiWidget>
					</FlexiTarget>
				</FlexiBoard>
			</div>
		</figure>

		<!-- Hand-drawn margin note: the one italic on the page. Once any bar has
		     been grabbed it has done its job — it sinks out on a fade and shrink
		     (opacity only under reduced motion). -->
		<div
			class="absolute -bottom-[54px] left-1/2 hidden -translate-x-[64%] transition-[opacity,translate,scale] duration-[420ms] ease-[var(--ease-snap)] lg:block {heroGrabbed
				? 'pointer-events-none opacity-0 motion-safe:translate-y-3 motion-safe:scale-90'
				: ''}"
			aria-hidden="true"
		>
			<div class="flex items-start gap-2">
				<svg width="44" height="46" viewBox="0 0 44 46" fill="none" class="-mt-3.5 shrink-0">
					<path
						d="M40 44 C 24 42, 11 32, 8 8"
						stroke="var(--fx-accent)"
						stroke-width="2"
						stroke-linecap="round"
						fill="none"
					/>
					<path
						d="M2 15 L 8 6 L 15 13"
						stroke="var(--fx-accent)"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						fill="none"
					/>
				</svg>
				<span class="text-body mt-3.5 inline-block -rotate-2 font-serif text-lg italic">
					Try it for yourself
				</span>
			</div>
		</div>
	</div>
</section>

<!-- ===== §02 ONE ENGINE ===== -->
<section class="page-gutter border-rule bg-panel border-t py-16">
	<div use:reveal>
		<SectionHeading class="mb-8">One engine to power them all</SectionHeading>
		<FeatureTheater />
	</div>
</section>

<!-- ===== §03 CODE + RESULT ===== -->
<!-- The ink and paper halves must still meet edge to edge, so the measure is
     capped on a wrapper rather than as section padding. -->
<section class="border-rule border-t">
	<div class="page-inner grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))]">
		<div use:reveal>
			<CodeListing
				caption="Listing 1 · a kanban board"
				lang={framework.meta.label + (framework.meta.status === 'preview' ? ' (preview)' : '')}
				source={kanbanListing}
				class="h-full px-6 py-11 lg:px-10"
			>
				{#if framework.current === 'react'}
					<p
						class="border-fx-accent text-on-ink m-0 mt-4.5 border-l-2 bg-white/5 px-3 py-2 text-xs"
					>
						Preview API — component names and props match the Svelte adapter; details may still move
						before 1.0 of <span class="text-white">@flexiboards/react</span>.
					</p>
				{:else}
					<p
						class="border-fx-accent text-on-ink m-0 mt-4.5 border-l-2 bg-white/5 px-3 py-2 text-xs"
					>
						Stable API — built on Svelte 5 signals; <span class="text-white"
							>@flexiboards/svelte</span
						> is what the examples below ship with.
					</p>
				{/if}
			</CodeListing>
		</div>

		<div
			class="border-rule bg-paper border-t px-6 py-11 lg:border-t-0 lg:border-l lg:px-10"
			use:reveal={120}
		>
			<div class="label text-faint mb-4.5 text-[11px]">Result · styled entirely by you</div>
			<!--
				The one deliberately un-Blueprint corner of the page: rounded cards,
				soft shadows, a mid-drag tile — proof the library carries *your* look,
				not this site's.
			-->
			<div class="grid grid-cols-2 gap-4">
				<div
					class="border-rule bg-panel rounded-[16px] border p-4 shadow-[0_12px_28px_rgba(16,32,46,0.06)]"
				>
					<div class="mb-3 flex items-center justify-between">
						<div class="font-serif text-[15px]">Incomplete</div>
						<span
							class="bg-tint text-blue min-w-[22px] rounded-full px-[7px] py-0.5 text-center text-[11.5px] font-semibold"
						>
							2
						</span>
					</div>
					<div class="flex flex-col gap-2">
						<div
							class="border-rule bg-tint-2 rounded-[10px] border px-3 py-2.5 text-[13.5px] shadow-[0_1px_2px_rgba(16,32,46,0.05)]"
						>
							Study for exam
						</div>
						<div
							class="border-rule box-border h-[41px] rounded-[10px] border-2 border-dashed"
						></div>
						<div
							class="bg-panel relative -mb-[46px] -translate-y-[46px] -rotate-2 cursor-grabbing rounded-[10px] border px-3 py-2.5 text-[13.5px] shadow-[0_14px_26px_rgba(16,32,46,0.16)]"
							style="border-color: color-mix(in srgb, var(--fx-accent) 45%, transparent)"
						>
							Research project
						</div>
					</div>
				</div>
				<div
					class="border-rule bg-panel rounded-[16px] border p-4 shadow-[0_12px_28px_rgba(16,32,46,0.06)]"
				>
					<div class="mb-3 flex items-center justify-between">
						<div class="font-serif text-[15px]">Done</div>
						<span
							class="bg-tint text-blue min-w-[22px] rounded-full px-[7px] py-0.5 text-center text-[11.5px] font-semibold"
						>
							2
						</span>
					</div>
					<div class="flex flex-col gap-2">
						<div
							class="border-rule bg-tint-2 text-faint decoration-rule rounded-[10px] border px-3 py-2.5 text-[13.5px] line-through shadow-[0_1px_2px_rgba(16,32,46,0.05)]"
						>
							Feed the cat
						</div>
						<div
							class="border-rule bg-tint-2 text-faint decoration-rule rounded-[10px] border px-3 py-2.5 text-[13.5px] line-through shadow-[0_1px_2px_rgba(16,32,46,0.05)]"
						>
							Recharge car
						</div>
					</div>
				</div>
			</div>
			<p class="text-body m-0 mt-5 max-w-[460px] text-[14.5px] leading-relaxed">
				Flexiboards ships only the bare necessary styles for drag-and-drop interactions, allowing
				you to give it the unique look that fits your project.
			</p>
		</div>
	</div>
</section>

<!-- ===== §04 ONE CORE, ONE ADAPTER PER FRAMEWORK ===== -->
<section class="page-gutter border-rule bg-panel border-t py-16">
	<div use:reveal>
		<SectionHeading class="mb-2.5">Use it with your favourite framework</SectionHeading>
		<p class="text-body m-0 mb-7 max-w-[720px] text-base leading-relaxed">
			The core of Flexiboards is entirely framework-agnostic. All that's needed to support your
			favourite framework is an adapter for it.
		</p>
		<div class="border-rule grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] border">
			{#each packages as pkg, i (pkg.name)}
				<div
					class="p-6 {i % 3 === 0 ? 'bg-paper' : ''} {i < packages.length - 1
						? 'border-rule border-b lg:border-r lg:border-b-0'
						: ''}"
				>
					<div class="mb-2.5 flex items-center justify-between gap-3">
						<span class="label text-faint text-[10.5px]">{pkg.kind}</span>
						{#if pkg.status}
							<Badge variant={pkg.status.variant}>{pkg.status.label}</Badge>
						{/if}
					</div>
					<h3 class="m-0 mb-1.5 font-serif text-lg">{pkg.name}</h3>
					<p class="text-body m-0 text-sm leading-relaxed">{pkg.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== §05 QUICKSTART ===== -->
<section class="graph-paper page-gutter border-rule bg-paper border-t py-16">
	<div use:reveal>
		<SectionHeading class="mb-7">Three steps to a board</SectionHeading>
	</div>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-5">
		<div class="border-ink bg-panel border p-6" use:reveal={100}>
			<div class="label text-fx-accent mb-3 text-[11px]">Step 01</div>
			<h3 class="m-0 mb-2.5 font-serif text-[19px]">Install</h3>
			<div class="bg-field text-on-ink px-3 py-2.5 font-mono text-[13px]">
				npm i {framework.meta.package}
			</div>
		</div>
		<div class="border-ink bg-panel border p-6" use:reveal={{ delay: 170, rise: 8 }}>
			<div class="label text-fx-accent mb-3 text-[11px]">Step 02</div>
			<h3 class="m-0 mb-2.5 font-serif text-[19px]">Declare a target</h3>
			<pre
				class="bg-field text-on-ink m-0 px-3 py-2.5 font-mono text-[13px] leading-[1.7]">{targetSnippet}</pre>
		</div>
		<div class="border-ink bg-panel border p-6" use:reveal={{ delay: 240, rise: 8 }}>
			<div class="label text-fx-accent mb-3 text-[11px]">Step 03</div>
			<h3 class="m-0 mb-2.5 font-serif text-[19px]">Style your widgets</h3>
			<p class="text-body m-0 text-[14.5px] leading-relaxed">
				Any markup, any CSS framework. Flexiboards only sets position and drag behaviour.
			</p>
		</div>
	</div>
</section>

<!-- ===== §06 EXAMPLES ===== -->
<section class="page-gutter border-rule bg-panel border-t py-16">
	<div class="mb-6 flex flex-wrap items-baseline justify-between gap-4" use:reveal>
		<div class="flex flex-wrap items-baseline gap-4">
			<SectionHeading>Built with Flexiboards</SectionHeading>
			<p class="text-body m-0 text-base leading-relaxed">
				See various examples of Flexiboards put into action.
			</p>
		</div>
		<Button href="/examples" variant="link">All examples</Button>
	</div>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-4">
		{#each examples as example, i (example.href)}
			<a
				href={example.href}
				class="border-rule bg-paper hover:border-ink border p-4 transition-[border-color,translate,scale,box-shadow] duration-[220ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:shadow-[0_10px_24px_rgba(16,32,46,0.10)] motion-safe:hover:-translate-y-1 motion-safe:active:scale-[0.98]"
				use:reveal={{ delay: 100 + STAGGER * i, rise: i === 0 ? 14 : 8 }}
			>
				<!--
					Thumbnails are boards, drawn as cells: never stock imagery. Each
					one is the arrangement that example actually demonstrates, with a
					dashed fx-accent cell marking the widget in motion.
				-->
				<div
					class="mb-3.5 grid h-[74px] gap-1.5"
					style="grid-template-columns:repeat({example.thumb
						.columns},1fr); grid-template-rows:repeat({example.thumb.rows},1fr)"
				>
					{#each example.thumb.cells as cell, i (i)}
						<div
							class={cell.moving
								? 'border-fx-accent bg-tint-accent border border-dashed'
								: 'border-rule bg-tint border'}
							style="grid-column:{cell.col}; grid-row:{cell.row}"
						></div>
					{/each}
				</div>
				<div class="mb-1 font-serif text-base">{example.title}</div>
				<div class="label text-faint text-[10.5px] tracking-[0.12em]">{example.meta}</div>
			</a>
		{/each}
	</div>
</section>

<!-- ===== SUPPORT CTA — the one fx-accent band on the page ===== -->
<section class="page-gutter border-ink bg-fx-accent border-t py-11 text-white">
	<div class="flex flex-wrap items-center justify-between gap-8" use:reveal={{ rise: 0 }}>
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
				class="ui bg-field px-5 py-3.5 text-[13.5px] text-white transition-opacity duration-[120ms] hover:opacity-85"
			>
				Star on GitHub
			</a>
			<a
				href="https://github.com/sponsors/Blakintosh"
				target="_blank"
				class="ui hover:text-fx-accent border border-white px-5 py-3.5 text-[13.5px] transition-colors duration-[120ms] hover:bg-white"
			>
				Sponsor
			</a>
		</div>
	</div>
</section>

<style>
	/*
	  Splash-only motion. These classes reach elements rendered through library
	  snippets and runtime-applied classes (the `reveal` action), so they are
	  declared :global — but they load with this page and nothing else uses the
	  names, so they never leak in practice.
	*/
	:global {
		/* One-shot entrances: the hero rises on load, sections rise as they scroll
		   in. Steep ease-out, 12–14px of travel — a snap into place, not a float. */
		@keyframes fb-rise {
			from {
				opacity: 0;
				transform: translateY(var(--rise, 12px));
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		.animate-fb-rise {
			animation: fb-rise 900ms var(--ease-snap) both;
		}

		/* The hero's idle nudge — "grab me" breathes until someone does. */
		@keyframes fb-pulse {
			0%,
			78%,
			100% {
				transform: scale(1);
			}
			84% {
				transform: scale(1.09);
			}
			90% {
				transform: scale(0.98);
			}
			95% {
				transform: scale(1.03);
			}
		}
		.animate-fb-pulse {
			animation: fb-pulse 4s ease-in-out infinite;
		}

		/* Drop-preview entrance: the dashed slice condenses out of a short blur
		   the moment it mounts (@starting-style), instead of popping in. */
		.shadow-enter {
			opacity: 1;
			filter: blur(0px);
			transform: scale(1);
			transition:
				opacity 200ms ease-out,
				filter 200ms ease-out,
				transform 320ms var(--ease-snap);
		}
		@starting-style {
			.shadow-enter {
				opacity: 0;
				filter: blur(8px);
				transform: scale(2.4);
			}
		}

		/* Scroll reveal: applied and sequenced by the `reveal` action. */
		.reveal {
			opacity: 0;
			transform: translateY(var(--rise, 14px));
			transition:
				opacity 900ms var(--ease-snap) var(--reveal-delay, 0ms),
				transform 900ms var(--ease-snap) var(--reveal-delay, 0ms);
		}
		.reveal.is-seen {
			opacity: 1;
			transform: none;
		}

		@media (prefers-reduced-motion: reduce) {
			/* Entrances keep the fade (it prevents a pop) but drop the travel. */
			.animate-fb-rise {
				animation-name: fb-fade;
				animation-delay: 0ms;
			}
			.animate-fb-pulse {
				animation: none;
			}
			.shadow-enter {
				transition: none;
			}
			.reveal {
				transform: none;
				transition-property: opacity;
				transition-delay: 0ms;
			}
		}
	}
</style>
