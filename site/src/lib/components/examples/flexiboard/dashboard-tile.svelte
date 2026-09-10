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

	// Sub-registry mapping tile types to their content and label.
	const tileRegistry = {
		mrr: { component: MrrTile, title: 'MRR' },
		subscriptions: { component: SubscriptionsTile, title: 'Subscriptions' },
		churn: { component: ChurnTile, title: 'Churn' },
		revenue: { component: RevenueTile, title: 'Revenue · 6 mo' },
		active: { component: ActiveTile, title: 'Active now' }
	} as const;

	const tileType = widget.metadata?.type as keyof typeof tileRegistry;
	const tileConfig = tileRegistry[tileType] ?? tileRegistry.mrr; // fallback
	const ContentComponent = tileConfig.component;
</script>

<!--
	Every widget is the same soft plate: white card, rounded corners, a resting
	shadow, and — only while the board is editable — a visible grab handle next
	to the label.
-->
<div
	class="bg-panel border-rule-soft shadow-card relative flex h-full w-full flex-col rounded-[14px] border p-3.5 lg:p-4"
	data-tile-type={tileType}
>
	<div class="text-faint flex shrink-0 items-center gap-1.5 text-[11.5px] font-semibold">
		{#if widget.draggability == 'full'}
			<Grabber size={grabberSize} class="-my-1.5 -ml-1.5" />
		{/if}
		<span class="truncate">{tileConfig.title}</span>
	</div>

	<div class="mt-3 flex min-h-0 flex-1 flex-col justify-end lg:mt-4">
		<ContentComponent />
	</div>

	{#if widget.resizable}
		<Resizer size={grabberSize} class="absolute bottom-1 right-1 cursor-col-resize" />
	{/if}
</div>
