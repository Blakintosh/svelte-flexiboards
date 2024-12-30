<script module lang="ts">
	import type { Component, Snippet } from 'svelte';
	import {
		FlexiWidget,
		flexiwidget,
		type BoardWidgetConfiguration,
		type FlexiWidgetChildrenSnippet
	} from '$lib/engine/widget.svelte.js';
	import { cn } from '$lib/site/utils.js';

	export type FlexiWidgetProps = BoardWidgetConfiguration & {
		children?: FlexiWidgetChildrenSnippet;
		component?: Component;
		class?: string;
		style?: string;
		inMotion?: boolean;
	};
</script>

<script lang="ts">
	let {
		children: childrenSnippet,
		component,
		class: className,
		...config
	}: FlexiWidgetProps = $props();

	const { onmousedown, widget } = flexiwidget(config, childrenSnippet, className);

	let children: Snippet<[{ widget: FlexiWidget }]> | null = childrenSnippet ?? widget.snippet;
	let Component: Component | null = component ?? widget.component;
</script>

<div
	class={cn(
		className ?? widget.className,
		'cursor-grab',
		widget.grabbed && 'animate-pulse cursor-grabbing',
		widget.isShadow && 'opacity-50'
	)}
	style={widget.style}
	{onmousedown}
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
