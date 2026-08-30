<script lang="ts">
	import { formatDuration, type Track } from './tracks.js';

	type NowPlayingProps = {
		current: Track | undefined;
		next: Track | undefined;
		playing: boolean;
	};

	let { current, next, playing }: NowPlayingProps = $props();
</script>

<!-- The one boxed object on the sheet: it summarises the order, so it earns a frame. -->
<div class="border-ink bg-tint shrink-0 border px-4 py-3">
	<span class="label text-blue text-[10px]">{playing ? 'Now playing' : 'Paused'}</span>

	<h2 class="text-ink mt-1 font-serif text-[18px] leading-tight sm:text-[20px]">
		{current?.title ?? '—'}
	</h2>
	<p class="text-body mt-0.5 text-[13px]">
		{current?.artist ?? ''}{current ? ` · ${formatDuration(current.seconds)}` : ''}
	</p>

	<div class="border-rule mt-3 border-t pt-2">
		<span class="label text-faint text-[10px]">
			Up next{next ? ` · ${next.title}` : ' · end of queue'}
		</span>
	</div>
</div>
