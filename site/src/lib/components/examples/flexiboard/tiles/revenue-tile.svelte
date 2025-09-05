<script module lang="ts">
	export type RevenueTileProps = {
		amount: string;
		change: string;
	};
</script>

<script lang="ts">
	let { amount, change }: RevenueTileProps = $props();
</script>

<div class="flex flex-col gap-1">
	<div class="text-lg font-bold lg:text-2xl">{amount}</div>
	<p class="text-muted-foreground text-xs">{change}</p>
</div>
