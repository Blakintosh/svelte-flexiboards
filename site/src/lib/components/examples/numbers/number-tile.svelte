<script module lang="ts">
	export type NumberTileProps = {
		number: number;
	};
</script>

<script lang="ts">
	let { number }: NumberTileProps = $props();
</script>

<!-- Numbers are mono, always. Placed widgets get a soft blue rule on tint. -->
<div
	class="flex h-full items-center justify-center rounded-[10px] border border-blue/30 bg-tint p-4 font-mono text-2xl text-blue"
>
	{number}
</div>
