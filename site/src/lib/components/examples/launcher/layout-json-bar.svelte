<script module lang="ts">
	export type CopyState = 'idle' | 'copied' | 'failed';

	export type LayoutJsonBarProps = {
		json: string;
		copyState: CopyState;
		/** Layout id of the tile currently in hand, if any — its x/y are marked. */
		highlightId?: string;
		oncopy: () => void;
		onreset: () => void;
	};
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Copy from 'lucide-svelte/icons/copy';
	import Check from 'lucide-svelte/icons/check';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';

	let { json, copyState, highlightId, oncopy, onreset }: LayoutJsonBarProps = $props();

	let listing: HTMLPreElement | null = $state(null);
	let handledFailure = $state(false);

	const copyLabel = $derived(
		copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Select' : 'Copy'
	);

	// The coordinate pair inside one entry, so only the numbers that move get the
	// accent — the rest of the line stays in the resting listing colour.
	const XY = /("x": -?\d+, "y": -?\d+)/;

	const lines = $derived(
		json.split('\n').map((text) => {
			if (!highlightId || !text.includes(`"id": "${highlightId}"`)) {
				return { text, before: '', xy: '', after: '' };
			}
			const match = XY.exec(text);
			if (!match) return { text, before: '', xy: '', after: '' };
			return {
				text,
				before: text.slice(0, match.index),
				xy: match[1],
				after: text.slice(match.index + match[1].length)
			};
		})
	);

	// Clipboard writes can be refused. When that happens the listing takes focus with
	// its text selected, so the layout can still be copied by hand — an invisible
	// action must never fail silently.
	$effect(() => {
		if (copyState !== 'failed') {
			handledFailure = false;
			return;
		}
		if (handledFailure || !listing) return;

		handledFailure = true;
		listing.focus();

		const selection = window.getSelection();
		if (!selection) return;
		const range = document.createRange();
		range.selectNodeContents(listing);
		selection.removeAllRanges();
		selection.addRange(range);
	});
</script>

<!--
	Docked to the bottom of the frame on the terminal ground: `bg-field` stays dark
	in both themes, so the listing reads as output rather than as more page.
-->
<div class="bg-field flex shrink-0 flex-col gap-1.5 px-4 py-2.5">
	<div class="flex items-center justify-between gap-4">
		<span class="label text-on-ink text-[10px]">Layout · live JSON</span>
		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="sm"
				class="text-on-ink-blue hover:text-on-ink h-7 rounded-none px-2 text-xs underline underline-offset-4 hover:bg-transparent"
				title="Copy exportLayout() output to the clipboard"
				onclick={oncopy}
			>
				{#if copyState === 'copied'}
					<Check class="size-3.5" />
				{:else}
					<Copy class="size-3.5" />
				{/if}
				{copyLabel}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="text-on-ink-faint hover:text-on-ink h-7 rounded-none px-2 text-xs hover:bg-transparent"
				title="Restore the seeded layout for every breakpoint"
				onclick={onreset}
			>
				<RotateCcw class="size-3.5" />
				Reset
			</Button>
		</div>
	</div>

	<!--
		Focusable on purpose: it is a scrollable region (WCAG 2.1.1) and the
		manual-copy fallback focuses it to select the layout.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<pre
		bind:this={listing}
		tabindex="0"
		aria-label="Live responsive layout JSON"
		class="text-on-ink-faint focus-visible:outline-fx-accent max-h-[16vh] overflow-auto font-mono text-[10.5px] leading-[1.6] whitespace-pre focus-visible:outline-2 focus-visible:-outline-offset-2">{#each lines as line, i}{#if line.xy}{line.before}<span
					class="text-on-ink-sage">{line.xy}</span
				>{line.after}{:else}{line.text}{/if}{#if i < lines.length - 1}{'\n'}{/if}{/each}</pre>
</div>
