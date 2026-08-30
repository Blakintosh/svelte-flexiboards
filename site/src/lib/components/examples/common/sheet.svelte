<script module lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * "Draftsman" sheet chrome shared by the board-concept examples (kanban,
	 * dashboard, compound, gallery): an ink-framed figure on graph paper with a
	 * mono fig-caption band on top and an annotation band underneath.
	 */
	type SheetProps = {
		/** Left side of the top band, e.g. "Fig 14 · Sprint board · 4 flow targets · append". */
		fig: string;
		/** Right side of the top band, e.g. "10 cards · 2 boards". */
		aside?: string;
		/** Optional bottom annotation band. */
		footer?: Snippet;
		children: Snippet;
		class?: string;
		/** Class for the scrolling body between the bands. */
		bodyClass?: string;
		/** Class for the right-hand fig-band text (e.g. fx-accent while editing). */
		asideClass?: string;
		/** Class for the bottom annotation band. */
		footerClass?: string;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		fig,
		aside,
		footer,
		children,
		class: className,
		bodyClass,
		asideClass,
		footerClass
	}: SheetProps = $props();
</script>

<figure class={cn('graph-paper border-ink flex min-h-0 flex-col border', className)}>
	<figcaption
		class="border-ink bg-paper flex shrink-0 items-center justify-between gap-4 border-b px-4 py-2.5 lg:px-8"
	>
		<span class="label text-faint truncate text-[10px]">{fig}</span>
		{#if aside}
			<span class={cn('text-faint shrink-0 font-mono text-[10px]', asideClass)}>{aside}</span>
		{/if}
	</figcaption>

	<div class={cn('relative flex min-h-0 flex-1 flex-col', bodyClass)}>
		{@render children()}
	</div>

	{#if footer}
		<div
			class={cn(
				'border-ink bg-paper flex shrink-0 items-center justify-between gap-4 border-t px-4 py-2.5 lg:px-8',
				footerClass
			)}
		>
			{@render footer()}
		</div>
	{/if}
</figure>
