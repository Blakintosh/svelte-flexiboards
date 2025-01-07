<script module lang="ts">
	import { flexiresize, FlexiWidget } from '$lib/system/widget.svelte.js';
	import type { Snippet } from 'svelte';
	import { type ClassValue } from 'clsx';
	import type { SvelteClassValue } from '$lib/system/types.js';

	type FlexiResizeProps = {
		children?: Snippet<[{ widget: FlexiWidget }]>;
		class?: SvelteClassValue;
	};
</script>

<script lang="ts">
	let { class: className, children }: FlexiResizeProps = $props();

	const { widget, onpointerdown } = flexiresize();
</script>

<button class={className} {onpointerdown}>
	{@render children?.({ widget })}
</button>
