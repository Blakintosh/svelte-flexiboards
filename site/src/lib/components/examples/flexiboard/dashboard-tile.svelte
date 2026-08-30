<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';
	import Grabber from '../common/grabber.svelte';
	import Resizer from '../common/resizer.svelte';
	import { MediaQuery } from 'svelte/reactivity';

	import MrrTile from './tiles/mrr-tile.svelte';
	import SubscriptionsTile from './tiles/subscriptions-tile.svelte';
	import ChurnTile from './tiles/churn-tile.svelte';
	import RevenueTile from './tiles/revenue-tile.svelte';
	import ActiveTile from './tiles/active-tile.svelte';

	const widget = getFlexiwidgetCtx();
	let mediaQuery = $state(new MediaQuery('(min-width: 1024px)'));
	// Larger handles on mobile for better touch targets
	let grabberSize = $derived(mediaQuery.current ? 18 : 22);

	// Sub-registry mapping tile types to their content and their plate index.
	// The index is drawn in the corner, so the order here is the reading order.
	const tileRegistry = {
		mrr: { component: MrrTile, title: 'MRR', index: '01' },
		subscriptions: { component: SubscriptionsTile, title: 'Subscriptions', index: '02' },
		churn: { component: ChurnTile, title: 'Churn', index: '03' },
		revenue: { component: RevenueTile, title: 'Revenue · 6 mo', index: '04' },
		active: { component: ActiveTile, title: 'Active now', index: '05' }
	} as const;

	const tileType = widget.metadata?.type as keyof typeof tileRegistry;
	const tileConfig = tileRegistry[tileType] ?? tileRegistry.mrr; // fallback
	const ContentComponent = tileConfig.component;
</script>

<!--
	Every widget is the same indexed plate: hairline frame on white, mono eyebrow,
	corner index, and — only while the board is editable — a visible grab handle.
-->
<div
	class="border-rule bg-panel relative flex h-full w-full flex-col border p-3 lg:p-4"
	data-tile-type={tileType}
>
	<span class="text-faint absolute top-2.5 right-3 font-mono text-[10px]">{tileConfig.index}</span>

	<div class="label text-faint flex shrink-0 items-center gap-1.5 pr-8 text-[10px]">
		{#if widget.draggability == 'full'}
			<Grabber size={grabberSize} class="-my-1.5 -ml-1.5" />
		{/if}
		<span class="truncate">{tileConfig.title}</span>
	</div>

	<div class="mt-3 flex min-h-0 flex-1 flex-col justify-end lg:mt-4">
		<ContentComponent />
	</div>

	{#if widget.resizable}
		<Resizer size={grabberSize} class="absolute right-1 bottom-1 cursor-col-resize" />
	{/if}
</div>
