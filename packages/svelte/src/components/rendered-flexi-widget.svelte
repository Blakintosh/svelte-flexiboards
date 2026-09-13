<script module lang="ts">
	import type {
		FlexiWidgetChildrenSnippetParameters,
		InternalFlexiWidgetController
	} from '@flexiboards/core';
	import { renderedflexiwidget } from '../adapters/widget.js';
	import WidgetTransitionPlaceholder from './widget-transition-placeholder.svelte';

	export type RenderedFlexiWidgetProps = {
		widget: InternalFlexiWidgetController;
		id?: string;
	};
</script>

<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { fromCore, reactive } from '../adapter.svelte.js';

	let { widget: widgetProp, id }: RenderedFlexiWidgetProps = $props();

	// Snapshot the controller rather than reading it through the prop.
	//
	// `$props()` reads are lazy getters into the parent's state, and a parent can
	// clear that state while this component is still mounted. FlexiAdd does that
	// the moment a dragged-in widget is released. Core's effects run
	// synchronously on signal writes, so the next write in that same release,
	// setBounds as the target places the widget, re-runs the bridged reads below.
	// Reading `widget.x` through a getter that has gone undefined throws, which
	// aborts the remaining release subscribers, including the portal's cleanup,
	// and strands the dragged widget in the portal.
	//
	// The controller is fixed for this component's lifetime anyway: the target's
	// {#each} is keyed by widget.id, and FlexiAdd renders inside an {#if}.
	const widget = widgetProp;

	// Consumer-facing handle. Snippet parameters must be reactive for user code.
	const publicWidget = reactive(widget);

	const { onpointerdown, onkeydown } = renderedflexiwidget(widget);

	// Bridge reads of core's signal-backed state into Svelte's reactivity.
	const style = $derived.by(fromCore(() => widget.style));
	const draggable = $derived.by(fromCore(() => widget.draggable));
	const grabbable = $derived.by(fromCore(() => widget.isGrabbable));
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

	// Core stores render types opaquely, so narrow them to Svelte's here.
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
		if (grabbable || resizable) {
			return 'Interactive widget';
		}

		return 'Static widget';
	});
</script>

<!-- The role changes to a group during a grab; the same element must retain keyboard focus. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={derivedClassName}
	{style}
	{onpointerdown}
	{onkeydown}
	aria-grabbed={draggable && !isShadow ? isGrabbed : undefined}
	aria-label={ariaLabel}
	aria-dropeffect={draggable ? 'move' : undefined}
	data-flexi-widget=""
	{id}
	aria-hidden={isShadow || undefined}
	inert={isShadow || undefined}
	role={isShadow ? undefined : isGrabbed ? 'group' : 'gridcell'}
	aria-colindex={isShadow || isGrabbed ? undefined : x + 1}
	aria-rowindex={isShadow || isGrabbed ? undefined : y + 1}
	aria-colspan={isShadow || isGrabbed ? undefined : width}
	aria-rowspan={isShadow || isGrabbed ? undefined : height}
	tabindex={isShadow ? undefined : grabbable && !hasGrabbers ? 0 : -1}
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

<!-- This occupies the widget's destination space so the widget can be absolutely positioned while it interpolates there. -->
{#if shouldDrawPlaceholder}
	<WidgetTransitionPlaceholder />
{/if}
