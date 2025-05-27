<script module lang="ts">
	import {
		type FlexiWidgetController,
		flexiwidget,
		type FlexiWidgetConfiguration,
		type FlexiWidgetChildrenSnippet,
		type FlexiWidgetClasses
	} from '$lib/system/widget.svelte.js';
	import type { FlexiCommonProps } from '$lib/system/types.js';

	export type FlexiWidgetProps = FlexiCommonProps<FlexiWidgetController> &
		Exclude<FlexiWidgetConfiguration, 'className' | 'snippet'> & {
			class?: FlexiWidgetClasses;
			children?: FlexiWidgetChildrenSnippet;
		};
</script>

<script lang="ts">
	let {
		class: className = $bindable(),
		children = $bindable(),
		controller = $bindable(),
		onfirstcreate,
		...propsConfig
	}: FlexiWidgetProps = $props();

	let config: FlexiWidgetConfiguration = $state({
		...propsConfig,
		className: className,
		snippet: children
	});

	const { widget } = flexiwidget(config);

	controller = widget;
	onfirstcreate?.(widget);

	let derivedClassName = $derived.by(() => {
		if (typeof widget.className === 'function') {
			return widget.className(widget);
		}

		return widget.className;
	});
</script>

<!-- TODO: right now, the widget position doesn't adjust for collisions during SSR, probably because
 	the effect only runs once during SSR. This MIGHT be unavoidable. If so, we should document this
	caveat with SSR and encourage users NOT to load boards with collisions, where possible. -->

<div
	class={derivedClassName}
	aria-grabbed={widget.isGrabbed}
	style={widget.style}
	role="gridcell"
	tabindex={0}
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