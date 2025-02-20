<script module lang="ts">
	export type FlowTileProps = {
		content: string;
	};
</script>

<script lang="ts">
	let { content }: FlowTileProps = $props();
</script>

<div
	class="flex h-full items-center justify-center rounded-md bg-muted p-4 text-base font-bold lg:text-2xl"
>
	{content}
</div>
