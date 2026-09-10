<script module lang="ts">
	import type {
		FlexiCommonProps,
		FlexiWidgetChildrenSnippet,
		FlexiWidgetClasses,
		FlexiWidgetConfiguration,
		FlexiWidgetController,
		InternalFlexiWidgetController
	} from '@flexiboards/core';
	import { flexiwidget } from '../adapters/widget.js';
	import { reactive } from '../adapter.svelte.js';
	import type { ClassValue } from 'svelte/elements';

	export type FlexiWidgetProps = FlexiCommonProps<FlexiWidgetController> &
		Exclude<FlexiWidgetConfiguration<ClassValue>, 'className' | 'snippet'> & {
			/**
			 * The class names to apply to this widget. Either a class value, or a
			 * function deriving one from the widget's state.
			 */
			class?: FlexiWidgetClasses<ClassValue>;

			/**
			 * The content rendered within the widget.
			 */
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

	let config: FlexiWidgetConfiguration<ClassValue> = $state({
		...propsConfig,
		...(className !== undefined && { className }),
		...(children !== undefined && { snippet: children })
	});

	// The widget is created lazily by the target, so hold the controller in state
	// and let the prop seam below run once it exists. The target always creates
	// internal controllers; updateConfig lives on the internal type.
	let createdWidget: InternalFlexiWidgetController | undefined = $state();

	// Callback so that we still fulfil these props.
	function onWidgetCreated(widget: FlexiWidgetController) {
		createdWidget = widget as InternalFlexiWidgetController;

		const publicWidget = reactive(widget);
		controller = publicWidget;
		onfirstcreate?.(publicWidget);
	}

	flexiwidget(config, onWidgetCreated);

	// Prop seam — see FlexiBoard. updateConfig() merges only the keys that
	// actually changed, so this neither clobbers state set imperatively on the
	// controller nor writes anything when the props are unchanged.
	//
	// Snippets and inline functions are safe to compare by identity here: a
	// component's setup runs once, so `{#snippet}` declarations and inline arrows
	// are stable consts rather than per-render allocations. A snippet's *contents*
	// were always reactive independently of this — it closes over the consumer's
	// state and re-reads it when rendered — so what this adds is propagation when
	// the consumer swaps in a structurally different snippet or class.
	$effect(() => {
		createdWidget?.updateConfig({
			...propsConfig,
			...(className !== undefined && { className }),
			...(children !== undefined && { snippet: children })
		});
	});

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
