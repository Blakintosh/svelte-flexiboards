<script module lang="ts">
	import { flexiresize, type FlexiWidgetController } from '$lib/system/widget.svelte.js';
	import type { Snippet } from 'svelte';
	import type { SvelteClassValue } from '$lib/system/types.js';

	type FlexiResizeProps = {
		children?: Snippet<[{ widget: FlexiWidgetController }]>;
		class?: SvelteClassValue;
	};
</script>

<script lang="ts">
	let { class: className, children }: FlexiResizeProps = $props();

	const { widget, onpointerdown, onkeydown } = flexiresize();
</script>

<button style={"user-select: none; cursor: nwse-resize; touch-action: none;"} class={className} {onpointerdown} {onkeydown}>
	{@render children?.({ widget })}
</button>
