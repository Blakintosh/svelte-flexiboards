<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { flexigrab } from '../adapters/widget.js';
	import type { FlexiWidgetController } from '@flexiboards/core';

	export type FlexiGrabProps = {
		/** The content of the handle. Receives the surrounding widget's controller. */
		children?: Snippet<[{ widget: FlexiWidgetController }]>;
		/** Classes applied to the rendered button. */
		class?: ClassValue;
	};
</script>

<script lang="ts">
	import { fromCore, reactive } from '../adapter.svelte.js';

	let { class: className, children }: FlexiGrabProps = $props();

	const { widget, onpointerdown, onkeydown } = flexigrab();
	const publicWidget = reactive(widget as FlexiWidgetController);

	const isGrabbable = $derived.by(fromCore(() => widget.isGrabbable));
	const mounted = $derived.by(fromCore(() => widget.mounted));
</script>

<button
	style={'user-select: none; touch-action: none;' +
		(isGrabbable && mounted ? 'cursor: grab;' : 'cursor: not-allowed;')}
	disabled={!isGrabbable || !mounted}
	class={className}
	{onpointerdown}
	{onkeydown}
>
	{@render children?.({ widget: publicWidget })}
</button>
