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
	let grabberSize = $derived(mediaQuery.current ? 20 : 16);

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
			props: { count: '+573', change: '+201 since last hour' }
		}
	} as const;

	// Get tile config from metadata
	const tileType = widget.metadata?.type as keyof typeof tileRegistry;
	const tileConfig = tileRegistry[tileType] || tileRegistry.score; // fallback
	const ContentComponent = tileConfig.component;
</script>

<Card.Root class="flex h-full w-full flex-col justify-between py-4" data-tile-type={tileType}>
	<div>
		<Card.Header class="px-2 lg:px-4">
			<Card.Title class="flex items-center gap-2 text-sm font-semibold lg:text-lg truncate">
				{#if widget.draggability == 'full'}
					<Grabber size={grabberSize} class="text-muted-foreground" />
				{/if}
				{tileConfig.title}
			</Card.Title>
		</Card.Header>
		<Card.Content class="px-2 lg:px-4 pt-4">
			<ContentComponent {...(tileConfig.props as any)} />
		</Card.Content>
	</div>
	<Card.Footer class="flex justify-end">
		{#if widget.resizable}
			<Resizer size={grabberSize} class="cursor-col-resize text-muted-foreground" />
		{/if}
	</Card.Footer>
</Card.Root>
