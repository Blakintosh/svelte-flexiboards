<script module lang="ts">
	import { onDestroy, tick, untrack, type Snippet } from 'svelte';
	import { flexitarget } from '$lib/system/target/index.js';
	import type { FlexiTargetController } from '$lib/system/target/base.svelte.js';
	import type { FlexiTargetPartialConfiguration } from '$lib/system/target/types.js';

	import type { FlexiCommonProps } from '$lib/system/types.js';

	export type FlexiTargetProps = FlexiCommonProps<FlexiTargetController> & {
		/**
		 * The header content of the target, above the grid.
		 */
		header?: Snippet<[{ target: FlexiTargetController }]>;

		/**
		 * The child content of the target, which should contain inner FlexiWidget
		 * definitions.
		 */
		children?: Snippet;

		/**
		 * The footer content of the target, below the grid.
		 */
		footer?: Snippet<[{ target: FlexiTargetController }]>;

		/**
		 * The class names to apply to the target's container element.
		 */
		containerClass?: string;

		/**
		 * The class names to apply to the target's grid element.
		 */
		class?: string;

		/**
		 * The configuration object for the target.
		 */
		config?: FlexiTargetPartialConfiguration;

		/**
		 * The unique identifier for the target.
		 * Used to identify the target when layouts are imported or exported.
		 */
		key?: string;
	};
</script>

<script lang="ts">
	import FlexiGrid from './flexi-grid.svelte';
	import FlexiTargetLoader from './flexi-target-loader.svelte';
	import RenderedFlexiWidget from './rendered-flexi-widget.svelte';
	import type { InternalFlexiWidgetController } from '$lib/system/widget/controller.svelte.js';

	let {
		children,
		class: className,
		header,
		footer,
		config,
		containerClass,
		controller = $bindable(),
		key,
		onfirstcreate
	}: FlexiTargetProps = $props();

	const { target } = flexitarget(config, key);

	// Target created, allow the caller to access it.
	controller = target;
	onfirstcreate?.(target);

	// Cleanup target subscriptions when component is destroyed
	onDestroy(() => {
		target.destroy();
	});
</script>

<div class={containerClass}>
	{@render header?.({ target: target as FlexiTargetController })}

	<!-- Allow user to specify components directly via a registration component. Once that's done, mount them to the actual target list dynamically -->
	<FlexiGrid class={className}>
		{#if children}
			<!-- Keep the initial widgets 'rendered' so that state inside children snippet doesn't get lost -->
			<div style={target.prepared ? 'visibility: hidden;' : ''}>
				{@render children()}
			</div>
		{/if}
		{#if target.prepared}
			<!-- Render widgets in deterministic order for tabbing and consistent DOM ordering -->
			{#each target.orderedWidgets as widget (widget.id)}
				<RenderedFlexiWidget {widget} />
			{/each}

			{#if target.dropzoneWidget}
				<RenderedFlexiWidget widget={target.dropzoneWidget} />
			{/if}
		{/if}
	</FlexiGrid>
	{@render footer?.({ target })}
</div>

<FlexiTargetLoader />
