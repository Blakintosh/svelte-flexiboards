<script module lang="ts">
	import {
		FlexiWidget as FlexiWidgetController,
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
</script>
