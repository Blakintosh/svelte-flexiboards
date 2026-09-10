<script lang="ts">
	import TrendingUp from 'lucide-svelte/icons/trending-up';
</script>

<!-- The one fx-accent metric on the sheet: churn rising is the thing to notice. -->
<div class="flex flex-col gap-2">
	<div class="text-ink font-serif text-[26px] font-semibold tracking-[-0.01em]">2.1%</div>
	<div class="flex items-center gap-1.5">
		<TrendingUp class="text-fx-accent size-3.5" />
		<p class="text-fx-accent text-[12px]">+0.3 pt</p>
	</div>
</div>
