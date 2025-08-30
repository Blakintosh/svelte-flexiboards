<script module lang="ts">
	import type { FlexiCommonProps } from '$lib/system/types.js';
	import { assistiveTextStyle, generateUniqueId } from '$lib/system/shared/utils.svelte.js';
	import { onDestroy, onMount } from 'svelte';
	import type {
		FlexiWidgetChildrenSnippet,
		FlexiWidgetClasses,
		FlexiWidgetConfiguration
	} from '$lib/system/widget/types.js';
	import type { FlexiWidgetController } from '$lib/system/widget/base.svelte.js';
	import { flexiwidget } from '$lib/system/widget/index.js';

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

	flexiwidget(config);

	// controller = widget;
	// onfirstcreate?.(widget);

	// let derivedClassName = $derived.by(() => {
	// 	if (typeof widget.className === 'function') {
	// 		return widget.className(widget);
	// 	}

	// 	return widget.className;
	// });

	// let assistiveTextId = generateUniqueId();
</script>

<!-- Only use noscript as an SSR fallback, because it won't look the same as the hydrated version. -->
<!-- <noscript style="display: contents;">
	<div
		class={derivedClassName}
		aria-grabbed={widget.isGrabbed}
		style={widget.style}
		role="cell"
		aria-label="Idle widget"
		aria-colindex={widget.x}
		aria-rowindex={widget.y}
		aria-colspan={widget.width}
		aria-rowspan={widget.height}
		aria-describedby={assistiveTextId}
		tabindex={0}
		bind:this={widget.ref}
	>
		<span style={assistiveTextStyle} id={assistiveTextId}>
			JavaScript is required to manipulate this widget.
		</span>
		{#if widget.snippet}
			{@render widget.snippet({
				widget
			})}
		{:else if widget.component}
			<widget.component {...widget.componentProps ?? {}} />
		{/if}
	</div>
</noscript> -->
