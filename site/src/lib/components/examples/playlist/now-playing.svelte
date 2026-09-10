<script lang="ts">
	import { formatDuration, type Track } from './tracks.js';

	type NowPlayingProps = {
		current: Track | undefined;
		next: Track | undefined;
		playing: boolean;
	};

	let { current, next, playing }: NowPlayingProps = $props();

	/*
	  When the track changes, the title/artist dissolve out and the replacement
	  condenses back in out of a short blur. Same staging idea as the splash
	  page's framework switch, but tuned for a small card: quicker, a softer
	  blur, and no tracking stretch (see .track-out/.track-in below).
	*/
	const SWAP_OUT_MS = 280;
	const SWAP_IN_MS = 480;

	let displayed = $state(current);
	let phase = $state<'out' | 'in' | null>(null);

	let outTimer: ReturnType<typeof setTimeout>;
	let inTimer: ReturnType<typeof setTimeout>;

	function reducedMotion() {
		return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	$effect(() => {
		const incoming = current;
		if (incoming?.id === displayed?.id) return;

		clearTimeout(outTimer);
		clearTimeout(inTimer);

		if (reducedMotion()) {
			displayed = incoming;
			phase = null;
			return;
		}

		phase = 'out';
		outTimer = setTimeout(() => {
			displayed = incoming;
			phase = 'in';
			inTimer = setTimeout(() => (phase = null), SWAP_IN_MS);
		}, SWAP_OUT_MS);
	});
</script>

<!-- The one boxed object on the sheet: it summarises the order, so it earns a card. -->
<div class="bg-tint shadow-card shrink-0 rounded-[14px] px-4 py-3.5">
	<span class="text-blue text-[11.5px] font-semibold">{playing ? 'Now playing' : 'Paused'}</span>

	{#key displayed?.id}
		<div class={phase === 'out' ? 'track-out' : phase === 'in' ? 'track-in' : ''}>
			<h2 class="text-ink mt-1 font-serif text-[18px] leading-tight sm:text-[20px]">
				{displayed?.title ?? '—'}
			</h2>
			<p class="text-body mt-0.5 text-[13px]">
				{displayed?.artist ?? ''}{displayed ? ` · ${formatDuration(displayed.seconds)}` : ''}
			</p>
		</div>
	{/key}

	<div class="border-rule-faint mt-3 border-t pt-2">
		<span class="text-faint text-[11.5px] font-semibold">
			Up next{next ? ` · ${next.title}` : ' · end of queue'}
		</span>
	</div>
</div>

<style>
	/* Track change, phase classes. The leaving title dissolves upward into a
	   soft blur; the replacement condenses back out of it. Reduced motion skips
	   the phases entirely in the script, so no override is needed here. */
	.track-out {
		opacity: 0;
		filter: blur(6px);
		transform: translateY(-2px);
		transition:
			opacity 280ms var(--ease-snap),
			filter 280ms var(--ease-snap),
			transform 280ms var(--ease-snap);
	}
	.track-in {
		animation: track-in 480ms var(--ease-snap) both;
	}
	@keyframes track-in {
		from {
			opacity: 0;
			filter: blur(6px);
			transform: translateY(2px);
		}
		to {
			opacity: 1;
			filter: none;
			transform: translateY(0);
		}
	}
</style>
