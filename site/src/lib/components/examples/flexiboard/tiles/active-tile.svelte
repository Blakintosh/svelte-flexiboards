<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2.5">
		<span class="text-ink font-serif text-[26px] font-semibold tracking-[-0.01em]">573</span>
		<!-- The permitted loop on this sheet: a dot marking a live count. Stilled under reduced motion. -->
		<span class="live-dot bg-fx-accent block size-2 rounded-full"></span>
	</div>
	<div class="flex items-center gap-1.5">
		<TrendingUp class="text-blue size-3.5" />
		<p class="text-blue text-[12px]">+201 / hr</p>
	</div>
</div>

<style>
	/* A slow ease rather than the terminal caret's hard steps() — this is a
	   heartbeat, not a cursor. */
	@media (prefers-reduced-motion: no-preference) {
		.live-dot {
			animation: live-dot 1.6s ease-in-out infinite;
		}
	}
	@keyframes live-dot {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}
</style>
