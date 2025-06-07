<script module lang="ts">
	import { flexiresize } from '$lib/system/widget/index.js';
	import type { FlexiWidgetController } from '$lib/system/widget/base.svelte.js';
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	type FlexiResizeProps = {
		children?: Snippet<[{ widget: FlexiWidgetController }]>;
		class?: ClassValue;
	};
</script>

<script lang="ts">
	let { class: className, children }: FlexiResizeProps = $props();

	const { widget, onpointerdown, onkeydown } = flexiresize();
</script>

<button
	style={'user-select: none; touch-action: none;' +
		(widget.resizability != 'none' && widget.mounted
			? 'cursor: nwse-resize'
			: 'cursor: not-allowed')}
	class={className}
	disabled={widget.resizability == 'none' || !widget.mounted}
	{onpointerdown}
	{onkeydown}
>
	{@render children?.({ widget })}
</button>
