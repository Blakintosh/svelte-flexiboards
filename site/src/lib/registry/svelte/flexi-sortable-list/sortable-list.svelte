<script lang="ts">
	import { FlexiSortable, FlexiWidget, type FlexiWidgetController } from '@flexiboards/svelte';
	import { cn } from '$lib/utils.js';
	import Grabber from '../flexi-handles/grabber.svelte';

	type Item = { id: string; label: string };

	let {
		items,
		class: className,
		onreorder
	}: {
		items: Item[];
		class?: string;
		/** Fires with the ids in their new order after every drop. */
		onreorder?: (ids: string[]) => void;
	} = $props();

	// Ids travel in metadata so a drop can be reported back in list order.
	const config = {
		onLayoutChange: (layout: Record<string, { metadata?: Record<string, unknown> }[]>) =>
			onreorder?.((layout.list ?? []).map((entry) => String(entry.metadata?.id)))
	};

	const rowClass = (widget: FlexiWidgetController) =>
		cn(
			'bg-card text-card-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm',
			widget.isShadow && 'border-dashed opacity-60',
			widget.isGrabbed && 'shadow-md'
		);
</script>

<FlexiSortable class={cn('gap-2', className)} {config}>
	{#each items as item (item.id)}
		<FlexiWidget class={rowClass} metadata={{ id: item.id }}>
			{#snippet children()}
				<Grabber />
				<span class="min-w-0 flex-1 truncate">{item.label}</span>
			{/snippet}
		</FlexiWidget>
	{/each}
</FlexiSortable>
