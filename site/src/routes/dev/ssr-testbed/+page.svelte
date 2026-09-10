<script lang="ts">
	/*
	  SSR testbed. Renders two boards (flow + free, the free one with a declared
	  collision so placement resolution runs during SSR) and then diagnoses the
	  server/client agreement three ways:

	  1. Captures console warnings/errors during hydration (Svelte logs any
	     hydration mismatch there in dev).
	  2. Fetches this page's server HTML after mount and compares every rendered
	     widget cell (position, span, grid-area style) against the live DOM.
	  3. Reports raw counts so an empty SSR payload can't silently pass.
	*/
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		ResponsiveFlexiBoard,
		type BreakpointSnippetParams,
		type FlexiBoardSuspenseReason
	} from '@flexiboards/svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// The "server-stored" layout picked by +page.server.ts — same data on the
	// server render and the hydration pass, as it would be from a database.
	let { data } = $props();

	// --- 1. Hydration warning capture. This module initialises before the
	// boards below hydrate, so wrapping console here catches their warnings.
	let hydrationLogs: string[] = $state([]);
	if (browser) {
		for (const level of ['warn', 'error'] as const) {
			const original = console[level];
			console[level] = (...args: unknown[]) => {
				const text = args.map(String).join(' ');
				if (/hydrat/i.test(text)) hydrationLogs.push(`[${level}] ${text}`);
				original.apply(console, args);
			};
		}
	}

	type CellRecord = {
		board: number;
		index: number;
		colindex: string | null;
		rowindex: string | null;
		colspan: string | null;
		rowspan: string | null;
		gridArea: string;
		text: string;
	};

	type Diff = { field: string; server: string; client: string; cell: string };

	let serverCells: CellRecord[] = $state([]);
	let clientCells: CellRecord[] = $state([]);
	let diffs: Diff[] = $state([]);
	let fetchError = $state('');
	let ran = $state(false);

	function extractCells(root: ParentNode): CellRecord[] {
		const records: CellRecord[] = [];
		root.querySelectorAll('[data-testbed-board]').forEach((board, b) => {
			board.querySelectorAll('[role="cell"]').forEach((cell, i) => {
				const style = cell.getAttribute('style') ?? '';
				const grid = style
					.split(';')
					.map((s) => s.trim())
					.filter((s) => s.startsWith('grid-'))
					.sort()
					.join('; ');
				records.push({
					board: b,
					index: i,
					colindex: cell.getAttribute('aria-colindex'),
					rowindex: cell.getAttribute('aria-rowindex'),
					colspan: cell.getAttribute('aria-colspan'),
					rowspan: cell.getAttribute('aria-rowspan'),
					gridArea: grid,
					text: (cell.textContent ?? '').trim()
				});
			});
		});
		return records;
	}

	onMount(async () => {
		clientCells = extractCells(document);
		try {
			const url = new URL(location.href);
			url.searchParams.set('variant', data.variant);
			const html = await (await fetch(url)).text();
			const serverDoc = new DOMParser().parseFromString(html, 'text/html');
			serverCells = extractCells(serverDoc);
		} catch (e) {
			fetchError = String(e);
			ran = true;
			return;
		}

		const found: Diff[] = [];
		const max = Math.max(serverCells.length, clientCells.length);
		for (let i = 0; i < max; i++) {
			const s = serverCells[i];
			const c = clientCells[i];
			const cellName = `board ${s?.board ?? c?.board} cell ${s?.index ?? c?.index}`;
			if (!s || !c) {
				found.push({
					field: 'presence',
					server: s ? 'present' : 'missing',
					client: c ? 'present' : 'missing',
					cell: cellName
				});
				continue;
			}
			for (const field of ['colindex', 'rowindex', 'colspan', 'rowspan', 'gridArea', 'text'] as const) {
				if (String(s[field]) !== String(c[field])) {
					found.push({ field, server: String(s[field]), client: String(c[field]), cell: cellName });
				}
			}
		}
		diffs = found;
		ran = true;
	});

	const pass = $derived(
		ran && !fetchError && serverCells.length > 0 && diffs.length === 0 && hydrationLogs.length === 0
	);

	const tileClass = (label: string) => `tile-${label}`;
</script>

<svelte:head><title>SSR testbed</title></svelte:head>

<main style="max-width: 960px; margin: 0 auto; padding: 2rem; font-family: monospace;">
	<h1 style="font-size: 1.2rem; margin-bottom: 1rem;">SSR testbed</h1>

	<section
		data-testbed-board
		style="margin-bottom: 2rem; border: 1px solid #ccc; padding: 1rem;"
	>
		<h2>Flow board (append placement)</h2>
		<FlexiBoard config={{ widgetDefaults: { draggable: true } }}>
			<FlexiTarget
				key="flow"
				class="testbed-grid"
				config={{
					rowSizing: 'minmax(0, 4rem)',
					layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append', rows: 3, columns: 3 }
				}}
			>
				{#snippet children()}
					<FlexiWidget class={tileClass('a')} width={1}>{#snippet children()}A{/snippet}</FlexiWidget>
					<FlexiWidget class={tileClass('b')} width={2}>{#snippet children()}B (2 wide){/snippet}</FlexiWidget>
					<FlexiWidget class={tileClass('c')} width={1}>{#snippet children()}C{/snippet}</FlexiWidget>
					<FlexiWidget class={tileClass('d')} width={1}>{#snippet children()}D{/snippet}</FlexiWidget>
				{/snippet}
			</FlexiTarget>
		</FlexiBoard>
	</section>

	<section
		data-testbed-board
		style="margin-bottom: 2rem; border: 1px solid #ccc; padding: 1rem;"
	>
		<h2>Free board (declared collision at 0,0)</h2>
		<FlexiBoard config={{ widgetDefaults: { draggable: true } }}>
			<FlexiTarget
				key="free"
				class="testbed-grid"
				config={{
					rowSizing: 'minmax(0, 4rem)',
					layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 3, maxRows: 4 }
				}}
			>
				{#snippet children()}
					<FlexiWidget class={tileClass('e')} x={0} y={0} width={2} height={1}>
						{#snippet children()}E at 0,0{/snippet}
					</FlexiWidget>
					<!-- Deliberate collision: also declared at 0,0 — placement must push it. -->
					<FlexiWidget class={tileClass('f')} x={0} y={0} width={1} height={1}>
						{#snippet children()}F collides{/snippet}
					</FlexiWidget>
					<FlexiWidget class={tileClass('g')} x={2} y={1} width={1} height={2}>
						{#snippet children()}G tall{/snippet}
					</FlexiWidget>
				{/snippet}
			</FlexiTarget>
		</FlexiBoard>
	</section>

	<section
		data-testbed-board
		style="margin-bottom: 2rem; border: 1px solid #ccc; padding: 1rem;"
	>
		<h2>initialLayout board (server picked variant {data.variant})</h2>
		<FlexiBoard
			config={{
				widgetDefaults: { draggable: true },
				registry: { block: {} },
				initialLayout: { seeded: data.seededLayout }
			}}
		>
			<FlexiTarget
				key="seeded"
				class="testbed-grid"
				config={{
					rowSizing: 'minmax(0, 4rem)',
					layout: { type: 'free', minColumns: 3, maxColumns: 3, minRows: 2, maxRows: 3 }
				}}
			>
				{#snippet children()}
					<!-- Deliberately declared: initialLayout must supersede it. -->
					<FlexiWidget>{#snippet children()}declared-should-not-render{/snippet}</FlexiWidget>
				{/snippet}
			</FlexiTarget>
		</FlexiBoard>
	</section>

	<section style="margin-bottom: 2rem; border: 1px solid #ccc; padding: 1rem;">
		<h2>Suspense: layout reason (loadLayout pending)</h2>
		<FlexiBoard
			config={{
				widgetDefaults: { draggable: true },
				loadLayout: () => undefined
			}}
		>
			{#snippet suspense({ reason }: FlexiBoardSuspenseReason)}
				<div data-suspense-fallback="layout">SUSPENSE-LAYOUT ({reason})</div>
			{/snippet}
			<FlexiTarget
				key="susp-layout"
				class="testbed-grid"
				config={{
					rowSizing: 'minmax(0, 4rem)',
					layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append', rows: 2, columns: 2 }
				}}
			>
				{#snippet children()}
					<FlexiWidget>{#snippet children()}stand-in{/snippet}</FlexiWidget>
				{/snippet}
			</FlexiTarget>
		</FlexiBoard>
	</section>

	<section style="margin-bottom: 2rem; border: 1px solid #ccc; padding: 1rem;">
		<h2>Suspense: breakpoint reason (responsive, assumed lg)</h2>
		<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024, sm: 640 }, ssrBreakpoint: 'lg' }}>
			{#snippet children({ currentBreakpoint }: BreakpointSnippetParams)}
				<FlexiBoard config={{ widgetDefaults: { draggable: true } }}>
					{#snippet suspense(s: FlexiBoardSuspenseReason)}
						<div data-suspense-fallback="breakpoint">
							SUSPENSE-BREAKPOINT ({s.reason}/{s.reason === 'breakpoint' ? s.assumed : ''})
						</div>
					{/snippet}
					<FlexiTarget
						key="susp-bp"
						class="testbed-grid"
						config={{
							rowSizing: 'minmax(0, 4rem)',
							layout: {
								type: 'flow',
								flowAxis: 'row',
								placementStrategy: 'append',
								rows: 2,
								columns: currentBreakpoint === 'lg' ? 3 : 1
							}
						}}
					>
						{#snippet children()}
							<FlexiWidget>{#snippet children()}bp-1 ({currentBreakpoint}){/snippet}</FlexiWidget>
							<FlexiWidget>{#snippet children()}bp-2{/snippet}</FlexiWidget>
						{/snippet}
					</FlexiTarget>
				</FlexiBoard>
			{/snippet}
		</ResponsiveFlexiBoard>
	</section>

	<section style="border: 2px solid {ran ? (pass ? 'green' : 'red') : '#999'}; padding: 1rem;">
		<h2>Diagnostics</h2>
		{#if !ran}
			<p>Running…</p>
		{:else}
			<p style="font-weight: bold; color: {pass ? 'green' : 'red'};">
				{pass ? 'PASS' : 'FAIL'}
			</p>
			<p>Server cells: {serverCells.length} · Client cells: {clientCells.length}</p>
			{#if fetchError}<p>Fetch error: {fetchError}</p>{/if}
			{#if hydrationLogs.length}
				<h3>Hydration console output ({hydrationLogs.length})</h3>
				<ul>{#each hydrationLogs as log}<li>{log}</li>{/each}</ul>
			{:else}
				<p>No hydration warnings.</p>
			{/if}
			{#if diffs.length}
				<h3>Server/client differences ({diffs.length})</h3>
				<ul>
					{#each diffs as d}
						<li>{d.cell} · {d.field}: server "{d.server}" vs client "{d.client}"</li>
					{/each}
				</ul>
			{:else}
				<p>No server/client cell differences.</p>
			{/if}
			<details>
				<summary>Server cells</summary>
				<pre>{JSON.stringify(serverCells, null, 2)}</pre>
			</details>
		{/if}
	</section>
</main>

<style>
	:global(.testbed-grid) {
		gap: 0.5rem;
		min-height: 14rem;
	}
	:global([class^='tile-']) {
		border: 1px solid #557;
		background: #eef;
		color: #113;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		font-size: 12px;
	}
</style>
