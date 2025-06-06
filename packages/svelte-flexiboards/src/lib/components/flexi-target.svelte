<script module lang="ts">
	import type { Snippet } from 'svelte';
	import {
		flexitarget,
		type FlexiTargetConfiguration,
		type FlexiTargetController,
		type FlexiTargetPartialConfiguration
	} from '$lib/system/target.svelte.js';
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

	const { onpointerenter, onpointerleave, target } = flexitarget(config, key);

	// Target created, allow the caller to access it.
	controller = target;
	onfirstcreate?.(target);
</script>

<div class={containerClass} {onpointerenter} {onpointerleave} role="grid" tabindex={0}>
	{@render header?.({ target })}

	<!-- Allow user to specify components directly via a registration component. Once that's done, mount them to the actual target list dynamically -->
	<FlexiGrid class={className}>
		{#if !target.prepared && children}
			{@render children()}
		{:else if target.prepared}
			{#each target.widgets as widget (widget)}
				<RenderedFlexiWidget {widget} />
			{/each}
		{/if}
	</FlexiGrid>
	{@render footer?.({ target })}
</div>

<FlexiTargetLoader />
