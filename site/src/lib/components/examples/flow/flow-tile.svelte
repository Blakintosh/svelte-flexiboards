<script module lang="ts">
	export type FlowTileProps = {
		content: string;
	};
</script>

<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';

	let { content }: FlowTileProps = $props();

	// The library's own transform positions the widget during drag, so the
	// grabbed tilt lives on this inner content instead of the widget itself.
	const widget = getFlexiwidgetCtx();
</script>

<!-- A placed widget is board furniture: soft tint fill, rounded corners, blue text. -->
<div
	class="border-rule-soft bg-tint text-blue flex h-full items-center justify-center rounded-[10px] border p-4 text-[12px] font-semibold motion-safe:transition-transform motion-safe:duration-[120ms] lg:text-[13px] {widget.isGrabbed
		? 'rotate-[2.5deg]'
		: ''}"
>
	{content}
</div>
