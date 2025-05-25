<script module lang="ts">
	import { renderedflexiwidget, type FlexiWidgetController } from '$lib/system/widget.svelte.js';
	import WidgetTransitionPlaceholder from './widget-transition-placeholder.svelte';

	export type RenderedFlexiWidgetProps = {
		widget: FlexiWidgetController;
	};
</script>

<script lang="ts">
	let { widget }: RenderedFlexiWidgetProps = $props();

	const { onpointerdown, onkeydown } = renderedflexiwidget(widget);

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
	{onkeydown}
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
			// NEXT: Remove these in v0.3
			component: widget.component,
			componentProps: widget.componentProps
		})}
	{:else if widget.component}
		<widget.component {...widget.componentProps ?? {}} />
	{/if}
</div>

<!-- When it exists, this temporarily occupies the widget's destination space, allowing the widget to be absolutely positioned to interpolate to its final destination. -->
{#if widget.shouldDrawPlaceholder}
	<WidgetTransitionPlaceholder />
{/if}
