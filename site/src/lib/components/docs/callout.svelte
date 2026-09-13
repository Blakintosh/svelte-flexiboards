<script module lang="ts">
	import type { Snippet } from 'svelte';

	export type CalloutVariant = 'info' | 'tip' | 'warning' | 'danger' | 'note';

	export type CalloutProps = {
		variant?: CalloutVariant;
		title?: string;
		children: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils';

	let { variant = 'info', title, children }: CalloutProps = $props();

	/*
	  Two grounds only: a note is blue on tint, anything that must be noticed is
	  fx-accent on tint-accent. The kicker carries the variant name in the label
	  voice; there is no icon, because the border already does that job.
	*/
	const config = {
		info: { title: 'Note', classes: 'border-blue bg-tint', kickerClass: 'text-blue' },
		tip: { title: 'Tip', classes: 'border-blue bg-tint', kickerClass: 'text-blue' },
		note: { title: 'Note', classes: 'border-blue bg-tint', kickerClass: 'text-blue' },
		warning: {
			title: 'Heads up',
			classes: 'border-fx-accent bg-tint-accent',
			kickerClass: 'text-fx-accent'
		},
		danger: {
			title: 'Warning',
			classes: 'border-fx-accent bg-tint-accent',
			kickerClass: 'text-fx-accent'
		}
	};

	const current = $derived(config[variant]);
	const displayTitle = $derived(title ?? current.title);
</script>

<div class={cn('not-prose my-6 border-l-2 px-5 py-4', current.classes)}>
	<span class={cn('label block text-[10px]', current.kickerClass)}>{current.title}</span>
	{#if displayTitle !== current.title}
		<p class="text-ink mb-0 mt-2 font-serif text-[15px] font-semibold">{displayTitle}</p>
	{/if}
	<div class="text-body mt-2 space-y-2 text-[14.5px] leading-relaxed">
		{@render children()}
	</div>
</div>
