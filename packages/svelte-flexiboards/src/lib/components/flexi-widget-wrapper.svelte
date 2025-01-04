<script module lang="ts">
	import type { FlexiWidget } from '$lib/system/widget.svelte.js';
	import type { Snippet } from 'svelte';

	type FlexiWidgetWrapperProps = {
		widget: FlexiWidget;
		children: Snippet;
	};
</script>

<script lang="ts">
	import { flexiwidgetwrapper } from '../system/utils.svelte.js';

	const { widget, children }: FlexiWidgetWrapperProps = $props();

	flexiwidgetwrapper(widget);
</script>

{@render children()}
