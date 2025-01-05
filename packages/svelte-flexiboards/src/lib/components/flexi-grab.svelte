<script module lang="ts">
	import { flexigrab, FlexiWidget } from '$lib/system/widget.svelte.js';
	import type { Snippet } from 'svelte';
	import { type ClassValue } from 'clsx';
	import type { SvelteClassValue } from '$lib/system/types.js';

	type FlexiGrabProps = {
		children?: Snippet<[{ widget: FlexiWidget }]>;
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
