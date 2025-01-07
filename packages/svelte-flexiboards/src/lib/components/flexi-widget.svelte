<script module lang="ts">
	import { untrack, type Component, type Snippet } from 'svelte';
	import {
		FlexiWidget,
		flexiwidget,
		type FlexiWidgetConfiguration,
		type FlexiWidgetChildrenSnippet,
		type FlexiWidgetClasses
	} from '$lib/system/widget.svelte.js';
	import type { FlexiCommonProps } from '$lib/system/types.js';

	export type FlexiWidgetProps = FlexiCommonProps<FlexiWidget> &
		Exclude<FlexiWidgetConfiguration, 'className' | 'snippet'> & {
			class?: FlexiWidgetClasses;
			children?: FlexiWidgetChildrenSnippet;
		};
</script>

<script lang="ts">
	let {
		class: className = $bindable(),
		children = $bindable(),
		this: _thisWidget = $bindable(),
		onfirstcreate,
		...propsConfig
	}: FlexiWidgetProps = $props();

	let config: FlexiWidgetConfiguration = $state({
		...propsConfig,
		className: className,
		snippet: children
	});

	const { onpointerdown, widget } = flexiwidget(config);
	_thisWidget = widget;
	onfirstcreate?.(widget);

	let childrenSnippet: FlexiWidgetChildrenSnippet | undefined = $derived(
		config.snippet ?? widget.snippet
	);
	let Component: Component | undefined = $derived(config.component ?? widget.component);
	let componentProps: Record<string, any> | undefined = $derived(
		config.componentProps ?? widget.componentProps
	);

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
	{#if childrenSnippet}
		{@render childrenSnippet({ widget, Component })}
	{:else if Component}
		<Component {...componentProps ?? {}} />
	{/if}
</div>
