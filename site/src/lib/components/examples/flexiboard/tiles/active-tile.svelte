<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2.5">
		<span class="text-ink font-mono text-[32px] leading-none lg:text-4xl">573</span>
		<!-- The permitted loop on this sheet: a caret marking a live count. Stilled under reduced motion. -->
		<span class="bg-fx-accent animate-fb-blink block size-2"></span>
	</div>
	<div class="flex items-center gap-1.5">
		<TrendingUp class="text-blue size-3.5" />
		<p class="text-blue font-mono text-[11px]">+201 / hr</p>
	</div>
</div>
