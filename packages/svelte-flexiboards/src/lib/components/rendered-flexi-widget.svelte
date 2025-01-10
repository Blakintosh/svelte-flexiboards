<script module lang="ts">
	import { untrack, type Component, type Snippet } from 'svelte';
	import {
		FlexiWidget as FlexiWidgetController,
		flexiwidget,
		type FlexiWidgetConfiguration,
		type FlexiWidgetChildrenSnippet,
		type FlexiWidgetClasses,
		renderedflexiwidget
	} from '$lib/system/widget.svelte.js';
	import type { FlexiCommonProps } from '$lib/system/types.js';

	export type RenderedFlexiWidgetProps = {
		widget: FlexiWidgetController;
	};
</script>

<script lang="ts">
	let { widget }: RenderedFlexiWidgetProps = $props();

	const { onpointerdown } = renderedflexiwidget(widget);

	let derivedClassName = $derived.by(() => {
		if (typeof widget.className === 'function') {
			return widget.className(widget);
		}

		return widget.className;
	});
</script>

<div
	class={derivedClassName}
	style={widget.style}
	{onpointerdown}
	aria-grabbed={widget.isGrabbed}
	aria-label="Flexi Widget"
	aria-roledescription="Flexi Widget"
	aria-dropeffect="move"
	role="gridcell"
	tabindex={0}
	bind:this={widget.ref}
>
	{#if widget.snippet}
		{@render widget.snippet({
			widget,
			Component: widget.component,
			componentProps: widget.componentProps
		})}
	{:else if widget.component}
		<widget.component {...widget.componentProps ?? {}} />
	{/if}
</div>
