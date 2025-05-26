<script module lang="ts">
	import { flexigrab, type FlexiWidgetController } from '$lib/system/widget.svelte.js';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	type FlexiGrabProps = {
		children?: Snippet<[{ widget: FlexiWidgetController }]>;
		class?: ClassValue;
	};
</script>

<script lang="ts">
	let { class: className, children }: FlexiGrabProps = $props();

	const { widget, onpointerdown, onkeydown } = flexigrab();
</script>

<button 
	style={
		"user-select: none; touch-action: none;" +
		widget.draggable ? "cursor: grab;" : "cursor: not-allowed;"
	} 
	disabled={!widget.draggable} 
	class={className} 
	{onpointerdown}
	{onkeydown}
>
	{@render children?.({ widget })}
</button>
