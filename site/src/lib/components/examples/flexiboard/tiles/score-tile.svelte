<script module lang="ts">
	export type ScoreTileProps = {
		score: number;
		change: string;
	};
</script>

<script lang="ts">
	let { score, change }: ScoreTileProps = $props();
</script>

<div class="flex flex-col gap-1">
	<div class="text-lg font-bold lg:text-2xl">{score}</div>
	<p class="text-muted-foreground text-xs">{change}</p>
</div>
