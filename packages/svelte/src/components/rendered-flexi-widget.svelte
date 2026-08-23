<script module lang="ts">
	import type {
		FlexiWidgetChildrenSnippetParameters,
		InternalFlexiWidgetController
	} from '@flexiboards/core';
	import { renderedflexiwidget } from '../adapters/widget.js';
	import WidgetTransitionPlaceholder from './widget-transition-placeholder.svelte';

	export type RenderedFlexiWidgetProps = {
		widget: InternalFlexiWidgetController;
	};
</script>

<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { fromCore, reactive } from '../adapter.svelte.js';

	let { widget: widgetProp }: RenderedFlexiWidgetProps = $props();

	// Snapshot the controller rather than reading it through the prop.
	//
	// `$props()` reads are lazy getters into the parent's state, and a parent can
	// clear that state while this component is still mounted — FlexiAdd does
	// exactly that the moment a dragged-in widget is released. Core's effects run
	// synchronously on signal writes, so the very next write in that same release
	// (setBounds, as the target places the widget) re-runs the bridged reads
	// below. Reading `widget.x` through a getter that has already gone undefined
	// throws, which aborts the remaining release subscribers — including the
	// portal's cleanup, stranding the dragged widget in the portal.
	//
	// The controller is fixed for this component's lifetime regardless: the
	// target's {#each} is keyed by widget.id, and FlexiAdd renders inside an {#if}.
	const widget = widgetProp;

	// Consumer-facing handle: snippet parameters must be reactive to read from user code.
	const publicWidget = reactive(widget);

	const { onpointerdown, onkeydown } = renderedflexiwidget(widget);

	// Bridge reads of core's signal-backed state into Svelte's reactivity.
	const style = $derived.by(fromCore(() => widget.style));
	const draggable = $derived.by(fromCore(() => widget.draggable));
	const resizable = $derived.by(fromCore(() => widget.resizable));
	const isShadow = $derived.by(fromCore(() => widget.isShadow));
	const isGrabbed = $derived.by(fromCore(() => widget.isGrabbed));
	const hasGrabbers = $derived.by(fromCore(() => widget.hasGrabbers));
	const x = $derived.by(fromCore(() => widget.x));
	const y = $derived.by(fromCore(() => widget.y));
	const width = $derived.by(fromCore(() => widget.width));
	const height = $derived.by(fromCore(() => widget.height));
	const shouldDrawPlaceholder = $derived.by(fromCore(() => widget.shouldDrawPlaceholder));

	const derivedClassName = $derived.by(
		fromCore(() => {
			if (typeof widget.className === 'function') {
				return widget.className(widget);
			}

			return widget.className;
		})
	);

	// Core stores render types opaquely (FlexiContent/FlexiComponent) — narrow them to Svelte's here.
	const snippet = $derived.by(
		fromCore(() => widget.snippet as Snippet<[FlexiWidgetChildrenSnippetParameters]> | undefined)
	);
	const WidgetComponent = $derived.by(
		fromCore(() => widget.component as Component<Record<string, any>> | undefined)
	);
	const componentProps = $derived.by(
		fromCore(() => (widget.componentProps ?? {}) as Record<string, any>)
	);

	const ariaLabel = $derived.by(() => {
		if (isShadow) {
			return 'Widget action preview';
		}
		if (draggable && resizable) {
			return 'Interactive widget';
		}

		return 'Static widget';
	});
</script>

<div
	class={derivedClassName}
	{style}
	{onpointerdown}
	{onkeydown}
	aria-grabbed={draggable && !isShadow ? isGrabbed : undefined}
	aria-label={ariaLabel}
	aria-dropeffect={draggable ? 'move' : undefined}
	role="cell"
	aria-colindex={x}
	aria-rowindex={y}
	aria-colspan={width}
	aria-rowspan={height}
	tabindex={draggable && !hasGrabbers ? 0 : undefined}
	bind:this={widget.ref}
>
	{#if snippet}
		{@render snippet({
			widget: publicWidget
		})}
	{:else if WidgetComponent}
		<WidgetComponent {...componentProps} />
	{/if}
</div>

<!-- When it exists, this temporarily occupies the widget's destination space, allowing the widget to be absolutely positioned to interpolate to its final destination. -->
{#if shouldDrawPlaceholder}
	<WidgetTransitionPlaceholder />
{/if}
