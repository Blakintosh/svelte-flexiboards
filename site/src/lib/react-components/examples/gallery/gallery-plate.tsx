import { FlexiResize, useFlexiWidget } from '@flexiboards/react';
import { cn } from '$lib/utils.js';
import { MoveDiagonal2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import PlateArtwork from './plate-artwork';
import type { Motif } from './plates';

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

type PlateMetadata = {
	plateId?: string;
	title?: string;
	motif?: Motif;
	note?: string;
	pair?: number;
	index?: number;
};

/*
	Shuffle and Reset re-create every widget, so a re-deal cannot be animated
	by the library — it is dressed as a deal instead: one short staggered
	entrance, never a loop. Scoped-style twin of `gallery-plate.svelte`.
*/
const plateInCss = `
.plate-in {
	animation: plate-in 260ms var(--ease-snap) both;
	animation-delay: calc(var(--plate-index, 0) * 24ms);
}
@keyframes plate-in {
	from { opacity: 0; transform: translateY(4px); }
	to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
	.plate-in { animation: none; }
}
`;

/** `2` when the bound is fixed, `2–3` when there is room to move. */
function bound(min: number, max: number): string {
	const upper = Number.isFinite(max) ? String(max) : '∞';
	return min === max ? String(min) : `${min}–${upper}`;
}

export default function GalleryPlate() {
	const widget = useFlexiWidget();

	const meta = (widget.metadata ?? {}) as PlateMetadata;

	const motif = meta.motif ?? 'grain';
	const pair = meta.pair ?? 0;
	const plateId = meta.plateId ?? 'PL-00';
	const title = meta.title ?? 'Cyanotype plate';
	// "PL-02 · panorama" — the catalogue number, plus a name where the plate has one.
	const caption = meta.note ? `${plateId} · ${meta.note}` : plateId;

	// Grabbing a plate detaches its element and dropping re-inserts it, which restarts
	// any CSS animation still on it — so the entrance class is shed as soon as it ends.
	// Decided in a ref rather than a state initializer: StrictMode invokes
	// initializers twice, and this one reads a module-level set.
	const firstDeal = useRef<boolean | null>(null);
	if (firstDeal.current === null) {
		firstDeal.current = !dealt.has(plateId);
		dealt.add(plateId);
	}
	const [entering, setEntering] = useState(firstDeal.current);

	const span = `${widget.width} × ${widget.height}`;
	const bounds = `${bound(widget.minWidth, widget.maxWidth)} × ${bound(widget.minHeight, widget.maxHeight)}`;

	// The drop preview is provisional: the widget's own dashed fx-accent frame says it all.
	if (widget.isShadow) {
		return <div className="h-full w-full"></div>;
	}

	return (
		<figure
			className={cn(
				entering && 'plate-in',
				'border-rule-soft bg-panel shadow-card relative flex h-full w-full cursor-grab flex-col rounded-[14px] border p-1.5 active:cursor-grabbing'
			)}
			style={{ '--plate-index': meta.index ?? 0 } as CSSProperties}
			onAnimationEnd={() => setEntering(false)}
		>
			<style>{plateInCss}</style>
			<div className="relative min-h-0 flex-1 overflow-hidden rounded-[9px]">
				<PlateArtwork motif={motif} pair={pair} />

				{/* Resizing is movement too, so the corner mark answers in fx-accent. */}
				<FlexiResize
					className={cn(
						'absolute right-1 bottom-1 rounded-[7px] p-1.5 transition-colors duration-[120ms] focus-visible:outline-2',
						'focus-visible:text-fx-accent focus-visible:outline-fx-accent hover:bg-tint hover:text-fx-accent active:bg-tint-accent active:text-fx-accent',
						// Mid-resize the mark is the live control, so it takes a soft accent fill.
						widget.isResizing ? 'bg-tint-accent text-fx-accent' : 'bg-panel/85 text-faint'
					)}
				>
					<MoveDiagonal2 size={14} />
					<span className="sr-only">Resize {plateId}</span>
				</FlexiResize>
			</div>

			<figcaption className="mt-1.5 flex shrink-0 items-baseline justify-between gap-2 px-0.5">
				<span className="text-faint truncate text-[10px] font-semibold">
					{widget.isResizing ? bounds : caption}
				</span>
				<span
					className={cn(
						'shrink-0 font-mono text-[10px]',
						widget.isResizing ? 'text-fx-accent' : 'text-body'
					)}
				>
					{span}
				</span>
				<span className="sr-only">{title}</span>
			</figcaption>
		</figure>
	);
}
