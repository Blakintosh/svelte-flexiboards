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
		config?: FlexiTargetPartialConfiguration<ClassValue>;

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
	import { fromCore, reactive, snapshotConfig } from '../adapter.svelte.js';
	import type { ClassValue } from 'svelte/elements';

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

	// Snapshotted so core never aliases the live `$state` proxy (see snapshotConfig).
	const { target } = flexitarget(snapshotConfig(config), key);

	// Target created, allow the caller to access it (reactive consumer-facing handle).
	const publicTarget = reactive(target as FlexiTargetController);
	controller = publicTarget;
	onfirstcreate?.(publicTarget);

	// Cleanup target subscriptions when component is destroyed
	onDestroy(() => {
		target.destroy();
	});

	// Prop seam — see FlexiBoard. Inert unless `config` actually changed.
	// snapshotConfig() reads every nested property, so in-place mutations of a
	// `$state` config (e.g. `config.widgetDefaults.transition = …`) re-run this too.
	$effect(() => {
		target.updateConfig(snapshotConfig(config));
	});

	// Bridge core-signal reads into Svelte's reactivity. These are plain
	// functions called from the template rather than $derived values: on the
	// server, $derived snapshots once during script init — before the widgets
	// are created below — which would server-render an empty board. A call in
	// the template reads at render position (after the loader has run), and on
	// the client fromCore's createSubscriber still registers reactivity.
	const prepared = fromCore(() => target.prepared);
	const orderedWidgets = fromCore(() => target.orderedWidgets);
	const dropzoneWidget = fromCore(() => target.dropzoneWidget);
	const shouldRenderDropzoneWidget = fromCore(() => target.shouldRenderDropzoneWidget);
</script>

<div class={containerClass}>
	{@render header?.({ target: publicTarget })}

	{#if children}
		<!-- Keep the initial widgets 'rendered' so that state inside children snippet doesn't get lost.
		     The FlexiWidget components in here register their configs during their init; they render
		     no markup of their own, so the div is inert and permanently hidden. -->
		<div style="display: none;">
			{@render children()}
		</div>
	{/if}
	<!-- Creates the registered widgets during its own init, in this same render
	     pass. Ordered deliberately: after the children snippet (registrations),
	     before FlexiGrid — so on the server the grid renders with its final
	     dimensions and the widgets block below renders the placed widgets. -->
	<FlexiTargetLoader />

	<FlexiGrid class={className}>
		{#if prepared()}
			<!-- Render widgets in deterministic order for tabbing and consistent DOM ordering -->
			{#each orderedWidgets() as widget (widget.id)}
				<RenderedFlexiWidget {widget} />
			{/each}

			{#if dropzoneWidget() && shouldRenderDropzoneWidget()}
				<RenderedFlexiWidget widget={dropzoneWidget()!} />
			{/if}
		{/if}
	</FlexiGrid>
	{@render footer?.({ target: publicTarget })}
</div>
