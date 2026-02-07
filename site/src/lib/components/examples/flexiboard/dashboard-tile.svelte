<script module lang="ts">
	import type { Component } from 'svelte';

	export type DashboardTileProps = {
		// Props come from widget metadata
	};
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { getFlexiwidgetCtx } from 'svelte-flexiboards';
	import Grabber from '../common/grabber.svelte';
	import Resizer from '../common/resizer.svelte';
	import { MediaQuery } from 'svelte/reactivity';

	// Import tile content components
	import ScoreTile from './tiles/score-tile.svelte';
	import RevenueTile from './tiles/revenue-tile.svelte';
	import SubscriptionsTile from './tiles/subscriptions-tile.svelte';
	import SalesTile from './tiles/sales-tile.svelte';
	import ActiveTile from './tiles/active-tile.svelte';

	let {} = $props();

	const widget = getFlexiwidgetCtx();
	let mediaQuery = $state(new MediaQuery('(min-width: 1024px)'));
	// Larger handles on mobile for better touch targets
	let grabberSize = $derived(mediaQuery.current ? 20 : 24);

	// Sub-registry that maps tile types to their components and props
	const tileRegistry = {
		score: {
			component: ScoreTile,
			title: "Overall Score",
			props: { score: 87, change: '+8 from last month' }
		},
		revenue: {
			component: RevenueTile,
			title: "Total Revenue",
			props: { amount: '$45,231.89', change: '+20.1% from last month' }
		},
		subscriptions: {
			component: SubscriptionsTile,
			title: "Subscriptions",
			props: { count: '+2350', change: '-30.4% from last month' }
		},
		sales: {
			component: SalesTile,
			title: "Sales",
			props: { count: '+12,234', change: '+19.1% from last month' }
		},
		active: {
			component: ActiveTile,
			title: "Active Now",
			props: { count: '573', change: '+201 since last hour' }
		}
	} as const;

	// Get tile config from metadata
	const tileType = widget.metadata?.type as keyof typeof tileRegistry;
	const tileConfig = tileRegistry[tileType] || tileRegistry.score; // fallback
	const ContentComponent = tileConfig.component;

	// Check if widget is wide (more than 1 column)
	let isWide = $derived(widget.width > 1);
</script>

{#if isWide}
	<!-- Wide layout: side-by-side with chart taking full height -->
	<Card.Root class="relative flex h-full w-full flex-row py-0 gap-0 from-primary/5 bg-gradient-to-t to-card" data-tile-type={tileType}>
		<!-- Left side: title, stats, controls -->
		<div class="flex w-44 shrink-0 flex-col p-3 lg:w-52 lg:p-4">
			<div class="flex items-center gap-2 text-sm font-semibold lg:text-base">
				{#if widget.draggability == 'full'}
					<Grabber size={grabberSize} class="text-muted-foreground" />
				{/if}
				{tileConfig.title}
			</div>
			<div class="mt-auto">
				<ContentComponent {...(tileConfig.props as any)} isWide={false} />
			</div>
		</div>
		<!-- Right side: full-height chart -->
		<div class="my-3 min-w-0 flex-1 border-l px-2 lg:my-4">
			<ContentComponent {...(tileConfig.props as any)} {isWide} chartOnly />
		</div>
		{#if widget.resizable}
			<Resizer size={grabberSize} class="absolute bottom-2 right-2 cursor-col-resize text-muted-foreground lg:bottom-3 lg:right-3" />
		{/if}
	</Card.Root>
{:else}
	<!-- Narrow layout: stacked -->
	<Card.Root class="flex h-full w-full flex-col py-3 lg:py-4 from-primary/5 bg-gradient-to-t to-card" data-tile-type={tileType}>
		<Card.Header class="shrink-0 px-3 lg:px-4">
			<Card.Title class="flex items-center gap-2 text-sm font-semibold lg:text-base truncate">
				{#if widget.draggability == 'full'}
					<Grabber size={grabberSize} class="text-muted-foreground" />
				{/if}
				{tileConfig.title}
			</Card.Title>
		</Card.Header>
		<Card.Content class="min-h-0 flex-1 px-3 pt-3 lg:px-4 lg:pt-4">
			<ContentComponent {...(tileConfig.props as any)} {isWide} />
		</Card.Content>
		<Card.Footer class="shrink-0 flex justify-end px-3 pt-2 lg:px-4">
			{#if widget.resizable}
				<Resizer size={grabberSize} class="cursor-col-resize text-muted-foreground" />
			{/if}
		</Card.Footer>
	</Card.Root>
{/if}
