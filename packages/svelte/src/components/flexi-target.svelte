<script module lang="ts">
	import { onDestroy, tick, untrack, type Snippet } from 'svelte';

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
	import type { FlexiCommonProps, FlexiTargetController, FlexiTargetPartialConfiguration } from '@flexiboards/core';
	import { flexitarget } from '../adapters/target.js';
	import { fromCore, reactive } from '../adapter.svelte.js';

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

	// Target created, allow the caller to access it (reactive consumer-facing handle).
	const publicTarget = reactive(target as FlexiTargetController);
	controller = publicTarget;
	onfirstcreate?.(publicTarget);

	// Cleanup target subscriptions when component is destroyed
	onDestroy(() => {
		target.destroy();
	});

	// Bridge core-signal reads into Svelte's reactivity.
	const prepared = $derived.by(fromCore(() => target.prepared));
	const orderedWidgets = $derived.by(fromCore(() => target.orderedWidgets));
	const dropzoneWidget = $derived.by(fromCore(() => target.dropzoneWidget));
	const shouldRenderDropzoneWidget = $derived.by(fromCore(() => target.shouldRenderDropzoneWidget));
</script>

<div class={containerClass}>
	{@render header?.({ target: publicTarget })}

	<!-- Allow user to specify components directly via a registration component. Once that's done, mount them to the actual target list dynamically -->
	<FlexiGrid class={className}>
		{#if children}
			<!-- Keep the initial widgets 'rendered' so that state inside children snippet doesn't get lost -->
			<div style={prepared ? 'visibility: hidden;' : ''}>
				{@render children()}
			</div>
		{/if}
		{#if prepared}
			<!-- Render widgets in deterministic order for tabbing and consistent DOM ordering -->
			{#each orderedWidgets as widget (widget.id)}
				<RenderedFlexiWidget {widget} />
			{/each}

			{#if dropzoneWidget && shouldRenderDropzoneWidget}
				<RenderedFlexiWidget widget={dropzoneWidget} />
			{/if}
		{/if}
	</FlexiGrid>
	{@render footer?.({ target: publicTarget })}
</div>

<FlexiTargetLoader />
