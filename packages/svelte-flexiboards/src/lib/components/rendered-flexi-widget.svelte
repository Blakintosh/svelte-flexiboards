<script module lang="ts">
	import { InternalFlexiWidgetController } from '$lib/system/widget/controller.svelte.js';
	import { renderedflexiwidget } from '$lib/system/widget/index.js';
	import WidgetTransitionPlaceholder from './widget-transition-placeholder.svelte';

	export type RenderedFlexiWidgetProps = {
		widget: InternalFlexiWidgetController;
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

	let ariaLabel = $derived.by(() => {
		if (widget.isShadow) {
			return 'Widget action preview';
		}
		if (widget.draggable && widget.resizable) {
			return 'Interactive widget';
		}

		return 'Static widget';
	});
</script>

<div
	class={derivedClassName}
	style={widget.style}
	{onpointerdown}
	{onkeydown}
	aria-grabbed={widget.draggable && !widget.isShadow ? widget.isGrabbed : undefined}
	aria-label={ariaLabel}
	aria-dropeffect={widget.draggable ? 'move' : undefined}
	role="cell"
	aria-colindex={widget.x}
	aria-rowindex={widget.y}
	aria-colspan={widget.width}
	aria-rowspan={widget.height}
	tabindex={widget.draggable && !widget.hasGrabbers ? 0 : undefined}
	bind:this={widget.ref}
>
	{#if widget.snippet}
		{@render widget.snippet({
			widget
		})}
	{:else if widget.component}
		<widget.component {...widget.componentProps ?? {}} />
	{/if}
</div>

<!-- When it exists, this temporarily occupies the widget's destination space, allowing the widget to be absolutely positioned to interpolate to its final destination. -->
{#if widget.shouldDrawPlaceholder}
	<WidgetTransitionPlaceholder />
{/if}
