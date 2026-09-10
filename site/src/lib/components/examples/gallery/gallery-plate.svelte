<script module lang="ts">
	/*
		A plate's component can be re-created outside a deal (e.g. the drop preview),
		so remember which plates have entered since the last deal: the stagger runs
		once per deal and never on a drop.
	*/
	const dealt = new Set<string>();

	/** Call before importing a layout so every plate enters again. */
	export function newDeal() {
		dealt.clear();
	}
</script>

<script lang="ts">
	import { FlexiResize, getFlexiwidgetCtx } from '@flexiboards/svelte';
	import MoveDiagonal2 from 'lucide-svelte/icons/move-diagonal-2';
	import PlateArtwork from './plate-artwork.svelte';
	import type { Motif } from './plates.js';

	type PlateMetadata = {
		plateId?: string;
		title?: string;
		motif?: Motif;
		note?: string;
		pair?: number;
		index?: number;
	};

	const widget = getFlexiwidgetCtx();

	const meta = $derived((widget.metadata ?? {}) as PlateMetadata);

	const motif = $derived(meta.motif ?? 'grain');
	const pair = $derived(meta.pair ?? 0);
	const plateId = $derived(meta.plateId ?? 'PL-00');
	const title = $derived(meta.title ?? 'Cyanotype plate');
	// "PL-02 · panorama" — the catalogue number, plus a name where the plate has one.
	const caption = $derived(meta.note ? `${plateId} · ${meta.note}` : plateId);

	// Grabbing a plate detaches its element and dropping re-inserts it, which restarts
	// any CSS animation still on it — so the entrance class is shed as soon as it ends.
	let entering = $state(!dealt.has(plateId));
	dealt.add(plateId);

	/** `2` when the bound is fixed, `2–3` when there is room to move. */
	function bound(min: number, max: number): string {
		const upper = Number.isFinite(max) ? String(max) : '∞';
		return min === max ? String(min) : `${min}–${upper}`;
	}

	const span = $derived(`${widget.width} × ${widget.height}`);
	const bounds = $derived(
		`${bound(widget.minWidth, widget.maxWidth)} × ${bound(widget.minHeight, widget.maxHeight)}`
	);
</script>

{#if widget.isShadow}
	<!-- The drop preview is provisional: the widget's own dashed fx-accent frame says it all. -->
	<div class="h-full w-full"></div>
{:else}
	<figure
		class={[
			entering && 'plate-in',
			'border-rule-soft bg-panel shadow-card relative flex h-full w-full cursor-grab flex-col rounded-[14px] border p-1.5 active:cursor-grabbing'
		]}
		style="--plate-index: {meta.index ?? 0}"
		onanimationend={() => (entering = false)}
	>
		<div class="relative min-h-0 flex-1 overflow-hidden rounded-[9px]">
			<PlateArtwork {motif} {pair} />

			<!-- Resizing is movement too, so the corner mark answers in fx-accent. -->
			<FlexiResize
				class={[
					'absolute bottom-1 right-1 rounded-[7px] p-1.5 transition-colors duration-[120ms] focus-visible:outline-2',
					'focus-visible:text-fx-accent focus-visible:outline-fx-accent hover:bg-tint hover:text-fx-accent active:bg-tint-accent active:text-fx-accent',
					// Mid-resize the mark is the live control, so it takes a soft accent fill.
					widget.isResizing ? 'bg-tint-accent text-fx-accent' : 'bg-panel/85 text-faint'
				]}
			>
				<MoveDiagonal2 size={14} />
				<span class="sr-only">Resize {plateId}</span>
			</FlexiResize>
		</div>

		<figcaption class="mt-1.5 flex shrink-0 items-baseline justify-between gap-2 px-0.5">
			<span class="text-faint truncate text-[10px] font-semibold">
				{widget.isResizing ? bounds : caption}
			</span>
			<span
				class="shrink-0 font-mono text-[10px] {widget.isResizing ? 'text-fx-accent' : 'text-body'}"
			>
				{span}
			</span>
			<span class="sr-only">{title}</span>
		</figcaption>
	</figure>
{/if}

<style>
	/*
		Shuffle and Reset re-create every widget, so a re-deal cannot be animated
		by the library — it is dressed as a deal instead: one short staggered
		entrance, never a loop.
	*/
	.plate-in {
		animation: plate-in 260ms var(--ease-snap) both;
		animation-delay: calc(var(--plate-index, 0) * 24ms);
	}

	@keyframes plate-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.plate-in {
			animation: none;
		}
	}
</style>
