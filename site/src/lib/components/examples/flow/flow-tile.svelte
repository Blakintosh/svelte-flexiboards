<script module lang="ts">
	export type FlowTileProps = {
		content: string;
	};
</script>

<script lang="ts">
	let { content }: FlowTileProps = $props();
</script>

<!-- A placed widget is board furniture: blue rule on tint, mono label. -->
<div
	class="label flex h-full items-center justify-center border border-blue bg-tint p-4 text-[11px] text-blue lg:text-[13px]"
>
	{content}
</div>
