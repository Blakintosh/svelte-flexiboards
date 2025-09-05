<script module lang="ts">
	export type SubscriptionsTileProps = {
		count: string;
		change: string;
	};
</script>

<script lang="ts">
	let { count, change }: SubscriptionsTileProps = $props();
</script>

<div class="flex flex-col gap-1">
	<div class="text-lg font-bold lg:text-2xl">{count}</div>
	<p class="text-muted-foreground text-xs">{change}</p>
</div>
