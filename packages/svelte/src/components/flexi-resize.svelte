<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { flexiresize } from '../adapters/widget.js';
	import type { FlexiWidgetController } from '@flexiboards/core';

	type FlexiResizeProps = {
		children?: Snippet<[{ widget: FlexiWidgetController }]>;
		class?: ClassValue;
	};
</script>

<script lang="ts">
	import { fromCore, reactive } from '../adapter.svelte.js';

	let { class: className, children }: FlexiResizeProps = $props();

	const { widget, onpointerdown, onkeydown } = flexiresize();
	const publicWidget = reactive(widget as FlexiWidgetController);

	const resizability = $derived.by(fromCore(() => widget.resizability));
	const mounted = $derived.by(fromCore(() => widget.mounted));
</script>

<button
	style={'user-select: none; touch-action: none;' +
		(resizability != 'none' && mounted ? 'cursor: nwse-resize' : 'cursor: not-allowed')}
	class={className}
	disabled={resizability == 'none' || !mounted}
	{onpointerdown}
	{onkeydown}
>
	{@render children?.({ widget: publicWidget })}
</button>
