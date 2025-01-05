<script module lang="ts">
	import { untrack, type Component, type Snippet } from 'svelte';
	import {
		FlexiWidget,
		flexiwidget,
		type FlexiWidgetConfiguration,
		type FlexiWidgetChildrenSnippet,
		type FlexiWidgetClasses
	} from '$lib/system/widget.svelte.js';

	export type FlexiWidgetProps = Exclude<FlexiWidgetConfiguration, 'className' | 'snippet'> & {
		class?: FlexiWidgetClasses;
		children?: FlexiWidgetChildrenSnippet;
	};
</script>

<script lang="ts">
	let {
		class: className = $bindable(),
		children = $bindable(),
		...propsConfig
	}: FlexiWidgetProps = $props();

	let config: FlexiWidgetConfiguration = $state({
		...propsConfig,
		className: className,
		snippet: children
	});

	const { onpointerdown, widget } = flexiwidget(config);

	let childrenSnippet: FlexiWidgetChildrenSnippet | undefined = $derived(
		config.snippet ?? widget.snippet
	);
	let Component: Component | undefined = $derived(config.component ?? widget.component);

	let derivedClassName = $derived.by(() => {
		if (typeof widget.className === 'function') {
			return widget.className(widget);
		} else if (typeof widget.className === 'object') {
			return [
				widget.className.default,
				widget.grabbed && widget.className.grabbed,
				widget.isShadow && widget.className.shadow
			];
		}

		return widget.className;
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
	{#if childrenSnippet}
		{@render childrenSnippet({ widget, Component })}
	{:else if Component}
		<Component />
	{/if}
</div>
