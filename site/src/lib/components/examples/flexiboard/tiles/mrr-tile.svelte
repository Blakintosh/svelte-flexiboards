<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
</script>

<!-- Numbers are mono; a rise reads blue — fx-accent is kept for the one metric that needs attention. -->
<div class="flex flex-col gap-2">
	<div class="text-ink font-mono text-[32px] leading-none lg:text-4xl">$45,231</div>
	<div class="flex items-center gap-1.5">
		<TrendingUp class="text-blue size-3.5" />
		<p class="text-blue font-mono text-[11px]">+20.1% MoM</p>
	</div>
</div>
