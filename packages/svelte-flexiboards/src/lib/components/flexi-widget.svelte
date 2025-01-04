<script module lang="ts">
	import type { Component, Snippet } from 'svelte';
	import {
		FlexiWidget,
		flexiwidget,
		type BoardWidgetConfiguration,
		type FlexiWidgetChildrenSnippet,
		type FlexiWidgetClasses
	} from '$lib/system/widget.svelte.js';

	export type FlexiWidgetProps = BoardWidgetConfiguration & {
		children?: FlexiWidgetChildrenSnippet;
		component?: Component;
		class?: FlexiWidgetClasses;
		style?: string;
	};
</script>

<script lang="ts">
	let { children: childrenSnippet, class: className, ...config }: FlexiWidgetProps = $props();

	const { onpointerdown, widget } = flexiwidget(config, childrenSnippet, className);

	let children: Snippet<[{ widget: FlexiWidget }]> | undefined = childrenSnippet ?? widget.snippet;
	let Component: Component | undefined = config.component ?? widget.component;

	let derivedClassName = $derived.by(() => {
		if(typeof widget.className === 'function') {
			return widget.className(widget);
		} else if(typeof widget.className === 'object') {
			return [
				widget.className.default, 
				widget.grabbed && widget.className.grabbed, 
				widget.isShadow && widget.className.shadow
			];
		}

		return className;
	});
</script>

<div
	class={derivedClassName}
	style={widget.style}
	{onpointerdown}
	aria-grabbed={!!widget.grabbed}
	aria-label="Flexi Widget"
	aria-roledescription="Flexi Widget"
	aria-dropeffect="move"
	role="gridcell"
	tabindex={0}
>
	<!-- Snippets mode -->
	{#if children}
		{@render children({ widget })}
	{/if}

	<!-- Component mode -->
	{#if Component}
		<Component />
	{/if}
</div>
