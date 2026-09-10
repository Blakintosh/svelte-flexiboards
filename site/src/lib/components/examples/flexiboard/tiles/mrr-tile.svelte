<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
</script>

<!-- The Domine value is the headline; a rise reads blue — fx-accent is kept for the one metric that needs attention. -->
<div class="flex flex-col gap-2">
	<div class="text-ink font-serif text-[26px] font-semibold tracking-[-0.01em]">$45,231</div>
	<div class="flex items-center gap-1.5">
		<TrendingUp class="text-blue size-3.5" />
		<p class="text-blue text-[12px]">+20.1% MoM</p>
	</div>
</div>
