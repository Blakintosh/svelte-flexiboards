import { useEffect, useRef, useState } from 'react';
import { formatDuration } from './tracks';
import type { Track } from './tracks';

export type NowPlayingProps = {
	current: Track | undefined;
	next: Track | undefined;
	playing: boolean;
};

/*
  When the track changes, the title/artist dissolve out and the replacement
  condenses back in out of a short blur. Same staging idea as the splash
  page's framework switch, but tuned for a small card: quicker, a softer
  blur, and no tracking stretch (see .track-out/.track-in below).
*/
const SWAP_OUT_MS = 280;
const SWAP_IN_MS = 480;

/* Scoped-style twin of `now-playing.svelte`'s <style> block. The leaving title
   dissolves upward into a soft blur; the replacement condenses back out of it.
   Reduced motion skips the phases entirely below, so no override is needed. */
const swapCss = `
.track-out {
	opacity: 0;
	filter: blur(6px);
	transform: translateY(-2px);
	transition:
		opacity 280ms var(--ease-snap),
		filter 280ms var(--ease-snap),
		transform 280ms var(--ease-snap);
}
.track-in { animation: track-in 480ms var(--ease-snap) both; }
@keyframes track-in {
	from { opacity: 0; filter: blur(6px); transform: translateY(2px); }
	to { opacity: 1; filter: none; transform: translateY(0); }
}
`;

function reducedMotion() {
	return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function NowPlaying({ current, next, playing }: NowPlayingProps) {
	const [displayed, setDisplayed] = useState<Track | undefined>(current);
	const [phase, setPhase] = useState<'out' | 'in' | null>(null);

	const outTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const inTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => {
		if (current?.id === displayed?.id) return;

		clearTimeout(outTimer.current);
		clearTimeout(inTimer.current);

		if (reducedMotion()) {
			setDisplayed(current);
			setPhase(null);
			return;
		}

		setPhase('out');
		outTimer.current = setTimeout(() => {
			setDisplayed(current);
			setPhase('in');
			inTimer.current = setTimeout(() => setPhase(null), SWAP_IN_MS);
		}, SWAP_OUT_MS);

		// StrictMode runs this twice; the timers restart rather than overlap.
		return () => {
			clearTimeout(outTimer.current);
			clearTimeout(inTimer.current);
		};
	}, [current, displayed?.id]);

	return (
		// The one boxed object on the sheet: it summarises the order, so it earns a card.
		<div className="bg-tint shadow-card shrink-0 rounded-[14px] px-4 py-3.5">
			<style>{swapCss}</style>
			<span className="text-blue text-[11.5px] font-semibold">
				{playing ? 'Now playing' : 'Paused'}
			</span>

			<div
				key={displayed?.id}
				className={phase === 'out' ? 'track-out' : phase === 'in' ? 'track-in' : ''}
			>
				<h2 className="text-ink mt-1 font-serif text-[18px] leading-tight sm:text-[20px]">
					{displayed?.title ?? '—'}
				</h2>
				<p className="text-body mt-0.5 text-[13px]">
					{displayed?.artist ?? ''}
					{displayed ? ` · ${formatDuration(displayed.seconds)}` : ''}
				</p>
			</div>

			<div className="border-rule-faint mt-3 border-t pt-2">
				<span className="text-faint text-[11.5px] font-semibold">
					Up next{next ? ` · ${next.title}` : ' · end of queue'}
				</span>
			</div>
		</div>
	);
}
