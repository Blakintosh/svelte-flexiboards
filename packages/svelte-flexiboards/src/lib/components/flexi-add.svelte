<script module lang="ts">
	import {
		FlexiAddController,
		flexiadd,
		type FlexiAddWidgetFn
	} from '$lib/system/manage.svelte.js';
	import FlexiWidget from './rendered-flexi-widget.svelte';
	import type { FlexiWidgetConfiguration } from '$lib/system/widget.svelte.js';
	import type { Snippet } from 'svelte';
	import type { FlexiCommonProps } from '$lib/system/types.js';
	import RenderedFlexiWidget from './rendered-flexi-widget.svelte';

	type FlexiAddChildrenProps = {
		onpointerdown: (event: PointerEvent) => void;
		style: string;
	};

	export type FlexiAddProps = FlexiCommonProps<FlexiAddController> & {
		children?: Snippet<[{ adder: FlexiAddController; props: FlexiAddChildrenProps }]>;
		addWidget: FlexiAddWidgetFn;
	};
</script>

<script lang="ts">
	let { children, addWidget, controller }: FlexiAddProps = $props();

	const { adder, onpointerdown } = flexiadd(addWidget);
	controller = adder;
</script>

{@render children?.({ adder, props: {
	onpointerdown,
	style: 'touch-action: none;'
} })}

<div style="display: none;">
	<!-- Mimics the behaviour of a FlexiTarget, as we need to render the widget so that we can "drag it in" from -->
	{#if adder.newWidget}
		<RenderedFlexiWidget widget={adder.newWidget} />
	{/if}	
</div>