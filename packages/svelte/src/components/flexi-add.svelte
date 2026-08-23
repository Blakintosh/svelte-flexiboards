<script module lang="ts">
	import { assistiveTextStyle, generateUniqueId, type FlexiAddClasses, type FlexiAddController, type FlexiAddWidgetFn, type FlexiCommonProps } from "@flexiboards/core";
	import type { Snippet } from "svelte";
	import { flexiadd } from "../adapters/misc.js";
	import RenderedFlexiWidget from "./rendered-flexi-widget.svelte";
	import { fromCore, reactive } from "../adapter.svelte.js";
	import type { ClassValue } from "svelte/elements";


	export type FlexiAddProps = FlexiCommonProps<FlexiAddController> & {
		/**
		 * The class names to apply to the adder's button element. Either a class
		 * value, or a function deriving one from the adder's state.
		 */
		class?: FlexiAddClasses<ClassValue>;

		/**
		 * The child content of the adder, containing the contents of the adder
		 * button.
		 */
		children?: Snippet<[{ adder: FlexiAddController }]>;

		/**
		 * When the user interacts with the adder, this function allows you to
		 * specify the configuration of the widget that is created and grabbed.
		 * Return null to cancel the add.
		 */
		addWidget: FlexiAddWidgetFn;
	};
</script>

<script lang="ts">
	let {
		children,
		addWidget,
		controller = $bindable(),
		onfirstcreate,
		class: className
	}: FlexiAddProps = $props();

	const { adder, onpointerdown, onkeydown } = flexiadd(addWidget);
	const publicAdder = reactive(adder as FlexiAddController);
	controller = publicAdder;
	onfirstcreate?.(publicAdder);

	// fromCore: the user's class function may read signal-backed adder state.
	let derivedClassName = $derived.by(
		fromCore(() => {
			if (typeof className === 'function') {
				return className(adder);
			}

			return className;
		})
	);

	let assistiveTextId = generateUniqueId();

	// The adapter owns the adder's lifecycle (destroy at unmount).
	// The read must *call* the signal — tracking happens at read time.
	let newWidget = $derived.by(fromCore(() => adder.newWidget$()));
</script>

<button
	class={derivedClassName}
	bind:this={adder.ref}
	aria-describedby={assistiveTextId}
	style={'touch-action: none;'}
	{onpointerdown}
	{onkeydown}
>
	<span style={assistiveTextStyle} id={assistiveTextId}>
		Press Enter to drag a new widget into this board.
	</span>
	{@render children?.({ adder: publicAdder })}
</button>

<div style="display: none;">
	<!-- Mimics the behaviour of a FlexiTarget, as we need to render the widget so that we can "drag it in" from -->
	{#if newWidget}
		<RenderedFlexiWidget widget={newWidget} />
	{/if}
</div>
