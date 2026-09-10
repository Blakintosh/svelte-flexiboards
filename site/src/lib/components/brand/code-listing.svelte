<script lang="ts" module>
	/*
	  Blueprint code listing: ink ground, mono, 1px border. Component names take
	  fx-accent, props pale blue, strings sage, punctuation muted.

	  The highlighter is deliberately tiny — these listings are hand-authored
	  marketing snippets, not arbitrary input. Docs code goes through Shiki.
	*/
	const escape = (s: string) =>
		s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	const FAINT = 'text-on-ink-faint';
	const NAME = 'text-fx-accent';
	const PROP = 'text-on-ink-blue';
	const STRING = 'text-on-ink-sage';

	const wrap = (cls: string, text: string) => `<span class="${cls}">${text}</span>`;

	/*
	  One pass over the escaped source, so the spans this emits are never
	  re-scanned as if they were code.
	*/
	const TOKENS = new RegExp(
		[
			// A tag delimiter and the component name it introduces.
			'(?<open>&lt;\\/?)(?<name>[A-Z]\\w*)',
			// Quoted strings.
			'(?<string>"[^"]*"|\'[^\']*\')',
			// Attribute names: preceded by whitespace, followed by = or the tag close.
			'(?<space>\\s)(?<prop>[a-zA-Z][\\w-]*)(?==|&gt;)',
			// Any remaining delimiter.
			'(?<delimiter>&lt;|&gt;)'
		].join('|'),
		'g'
	);

	export function highlightMarkup(source: string): string {
		return escape(source).replace(TOKENS, (match, ...args) => {
			const g = args[args.length - 1] as Record<string, string | undefined>;
			if (g.name) return wrap(FAINT, g.open!) + wrap(NAME, g.name);
			if (g.string) return wrap(STRING, g.string);
			if (g.prop) return g.space! + wrap(PROP, g.prop);
			if (g.delimiter) return wrap(FAINT, g.delimiter);
			return match;
		});
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { framework } from './framework.svelte';

	let {
		caption,
		lang,
		source,
		children,
		class: className = ''
	}: {
		caption: string;
		lang?: string;
		source: string;
		children?: Snippet;
		class?: string;
	} = $props();

	// Animate the listing only when it changes, never on first paint.
	let swapped = $state(false);
	$effect(() => {
		void source;
		return () => (swapped = true);
	});

	/*
	  Framework-switch dissolve: while the store stages the swap, the old
	  listing blurs out and the new one condenses in, trailing the install
	  command (see `swap-out`/`swap-in` in app.css).
	*/
	const phase = $derived(framework.swap);
	const phased = $derived(phase === 'out' ? 'swap-out' : phase === 'in' ? 'swap-in' : '');
</script>

<div class="bg-field text-on-ink font-mono text-[13.5px] leading-[1.75] {className}">
	<div class="label text-on-ink-faint mb-4.5 flex items-center justify-between gap-4 text-[11px]">
		<span>{caption}</span>
		{#if lang}
			<span class="text-fx-accent inline-block {phased}">{lang}</span>
		{/if}
	</div>
	<!-- Source is a module-local constant, never user input. -->
	<!-- eslint-disable svelte/no-at-html-tags -->
	{#key source}
		<pre
			class="m-0 {phase ? phased : swapped ? 'animate-fb-in' : ''} overflow-x-auto whitespace-pre"
			style="--swap-delay: 200ms">{@html highlightMarkup(source)}</pre>
	{/key}
	<!-- eslint-enable svelte/no-at-html-tags -->
	{#if children}
		<div class={phased} style="--swap-delay: 260ms">
			{@render children()}
		</div>
	{/if}
</div>
