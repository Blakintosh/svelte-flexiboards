<script module lang="ts">
	import { flexigrab, type FlexiWidgetController } from '$lib/system/widget.svelte.js';
	import type { Snippet } from 'svelte';
	import type { SvelteClassValue } from '$lib/system/types.js';

	type FlexiGrabProps = {
		children?: Snippet<[{ widget: FlexiWidgetController }]>;
		class?: SvelteClassValue;
	};
</script>

<script lang="ts">
	let { class: className, children }: FlexiGrabProps = $props();

	const { widget, onpointerdown } = flexigrab();
</script>

<button class={className} {onpointerdown}>
	{@render children?.({ widget })}
</button>
