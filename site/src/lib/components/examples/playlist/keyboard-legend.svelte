<script lang="ts">
	import { cn } from '$lib/utils.js';

	type KeyboardLegendProps = {
		/** The title of the track currently in hand, or null when nothing is grabbed. */
		movingTitle: string | null;
	};

	let { movingTitle }: KeyboardLegendProps = $props();

	const moving = $derived(movingTitle !== null);
</script>

{#snippet keycap(label: string)}
	<kbd
		class={cn(
			'inline-flex items-center rounded-[7px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none',
			moving
				? 'border-fx-accent/50 bg-tint-accent text-fx-accent-hover'
				: 'border-rule-soft text-faint'
		)}
	>
		{label}
	</kbd>
{/snippet}

<!--
	The key bindings are on the sheet before anyone presses anything, and the strip
	swaps to the in-flight bindings while a row is held. FlexiBoard already owns the
	aria-live channel (FlexiAnnouncer), so this stays a visual affordance only.
-->
<div
	class="border-rule-soft flex shrink-0 flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between"
>
	<span class={cn('text-[11.5px] font-semibold', moving ? 'text-fx-accent' : 'text-faint')}>
		{moving ? `Moving · ${movingTitle}` : 'Reorder the queue'}
	</span>

	<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
		{#if moving}
			<span class="flex items-center gap-1">
				{@render keycap('↑')}
				{@render keycap('↓')}
				<span class="text-faint ml-0.5 text-[11px] font-semibold">move</span>
			</span>
			<span class="flex items-center gap-1">
				{@render keycap('↵')}
				<span class="text-faint ml-0.5 text-[11px] font-semibold">drop</span>
			</span>
			<span class="flex items-center gap-1">
				{@render keycap('Esc')}
				<span class="text-faint ml-0.5 text-[11px] font-semibold">cancel</span>
			</span>
		{:else}
			<span class="flex items-center gap-1">
				{@render keycap('Tab')}
				<span class="text-faint ml-0.5 text-[11px] font-semibold">a handle</span>
			</span>
			<span class="flex items-center gap-1">
				{@render keycap('↵')}
				<span class="text-faint ml-0.5 text-[11px] font-semibold">grab</span>
			</span>
		{/if}
	</div>
</div>
