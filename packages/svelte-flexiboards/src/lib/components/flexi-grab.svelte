<script module lang="ts">
	import { flexigrab } from '$lib/system/widget/index.js';
	import type { FlexiWidgetController } from '$lib/system/widget/base.svelte.js';
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
	style={'user-select: none; touch-action: none;' +
		(widget.isGrabbable && widget.mounted ? 'cursor: grab;' : 'cursor: not-allowed;')}
	disabled={!widget.isGrabbable || !widget.mounted}
	class={className}
	{onpointerdown}
	{onkeydown}
>
	{@render children?.({ widget })}
</button>
