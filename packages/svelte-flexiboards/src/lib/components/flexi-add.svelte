<script module lang="ts">
	import {
		FlexiAddController,
		flexiadd,
		type FlexiAddClasses,
		type FlexiAddWidgetFn
	} from '$lib/system/manage.svelte.js';
	import FlexiWidget from './rendered-flexi-widget.svelte';
	import type { FlexiWidgetConfiguration } from '$lib/system/widget.svelte.js';
	import type { Snippet } from 'svelte';
	import type { FlexiCommonProps } from '$lib/system/types.js';
	import RenderedFlexiWidget from './rendered-flexi-widget.svelte';

	/** @deprecated FlexiAdd's children props are now redundant and will be removed in v0.4. */
	type FlexiAddChildrenProps = {
		/**
		 * @deprecated This has been replaced with internal pointer management and is redundant. This event will be removed in v0.4.
		 */
		onpointerdown: (event: PointerEvent) => void;
		/**
		 * @deprecated This has been moved to the internal button so is now redundant. It will be removed in v0.4.
		 */
		style: string;
	};

	export type FlexiAddProps = FlexiCommonProps<FlexiAddController> & {
		class?: FlexiAddClasses;
		'aria-label'?: string;
		children?: Snippet<[{ adder: FlexiAddController; props: FlexiAddChildrenProps }]>;
		addWidget: FlexiAddWidgetFn;
	};
</script>

<script lang="ts">
	let { 
		children, 
		addWidget, 
		controller = $bindable(), 
		onfirstcreate,
		class: className,
		'aria-label': ariaLabel = 'Add a widget'
	}: FlexiAddProps = $props();

	const { adder, onpointerdown, onkeydown } = flexiadd(addWidget);
	controller = adder;
	onfirstcreate?.(adder);

	const dummyOnpointerdown = (event: PointerEvent) => {};

	let derivedClassName = $derived.by(() => {
		if(!adder) {
			return '';
		}

		if(typeof className === 'function') {
			return className(adder);
		}

		return className;
	});
</script>

<!-- TODO: will probably need a breaking change, because we need a ref to get the start widget position -->
<button 
	class={derivedClassName} 
	bind:this={adder.ref}
	aria-label={ariaLabel}
	style={"touch-action: none;"}
	{onpointerdown}
	{onkeydown}
>
	{@render children?.({ adder, props: { style: '', onpointerdown: dummyOnpointerdown } })}
</button>

<div style="display: none;">
	<!-- Mimics the behaviour of a FlexiTarget, as we need to render the widget so that we can "drag it in" from -->
	{#if adder.newWidget}
		<RenderedFlexiWidget widget={adder.newWidget} />
	{/if}	
</div>