<script module lang="ts">
	export type NumberTileProps = {
		number: number;
	};
</script>

<script lang="ts">
	let { number }: NumberTileProps = $props();
</script>

<div class="flex h-full items-center justify-center rounded-md bg-muted p-4 text-2xl font-bold">
	{number}
</div>
