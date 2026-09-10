<script module lang="ts">
	/**
	 * The shape carried in each card widget's `metadata`. Everything the card
	 * renders comes from there, so a card survives export → localStorage →
	 * import without the page holding a parallel copy of the data.
	 */
	export type KanbanCardData = {
		title: string;
		tag: string;
		assignee: string;
		initials: string;
		due: string;
		overdue?: boolean;
	};
</script>

<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';

	// No props: the widget controller is the source of truth, exactly as the
	// board rebuilt it from the imported layout.
	const widget = getFlexiwidgetCtx();

	const card = $derived((widget.metadata ?? {}) as Partial<KanbanCardData>);
</script>

<!--
	The card in hand is the only thing on the sheet that moves: a 1° tilt on the
	contents, so the library's own transform on the widget stays untouched.
-->
<div
	class="flex min-w-0 flex-col gap-2 motion-safe:transition-transform motion-safe:duration-[120ms] {widget.isGrabbed
		? '-rotate-[2.5deg]'
		: ''}"
>
	<h3 class="text-ink line-clamp-3 text-[13px] leading-snug">{card.title ?? 'Untitled card'}</h3>

	<!-- Meta: a tag pill on the left, who and when — genuinely tabular data — in mono on the right. -->
	<div class="flex min-w-0 items-center gap-2 text-[10px]">
		<span class="bg-tint text-body shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
			>{card.tag ?? 'Task'}</span
		>
		<!-- The one data use of fx-accent: a date that has already passed. -->
		<span
			class="ml-auto truncate font-mono text-[11px] {card.overdue ? 'text-fx-accent' : 'text-faint'}"
		>
			{card.overdue ? 'Overdue' : (card.initials ?? '?')} · {card.overdue
				? (card.initials ?? '?')
				: (card.due ?? '—')}
		</span>
		<span class="sr-only">Assigned to {card.assignee ?? 'nobody'}</span>
	</div>
</div>
