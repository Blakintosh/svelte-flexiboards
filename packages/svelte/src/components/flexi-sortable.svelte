<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type {
		FlexiBoardConfiguration,
		FlexiBoardController,
		FlexiCommonProps,
		FlexiTargetPartialConfiguration
	} from '@flexiboards/core';

	export type FlexiSortableProps = FlexiCommonProps<FlexiBoardController> & {
		/**
		 * Which way the list runs. Vertical is a column of rows, horizontal a row
		 * of columns.
		 * @default 'vertical'
		 */
		direction?: 'vertical' | 'horizontal';

		/**
		 * The target key, used when a layout is exported or imported.
		 * @default 'list'
		 */
		key?: string;

		/**
		 * Classes for the list's grid element (the place for `gap-*`).
		 */
		class?: string;

		/**
		 * Classes for the element wrapping the grid.
		 */
		containerClass?: string;

		/**
		 * Classes for the board's root element.
		 */
		boardClass?: ClassValue;

		/**
		 * Board configuration merged over the preset's defaults, which make widgets
		 * fully draggable. Anything a FlexiBoard accepts: callbacks, registry,
		 * layouts.
		 */
		config?: FlexiBoardConfiguration<ClassValue>;

		/**
		 * Target configuration merged over the preset's. `direction` fixes the
		 * layout, and sizing and widget defaults are yours to set.
		 */
		targetConfig?: Omit<FlexiTargetPartialConfiguration<ClassValue>, 'layout'>;

		/**
		 * The list items: FlexiWidget declarations.
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	/*
	  A sortable list is one flow target on one board. When a second list is
	  needed, the same props move onto FlexiBoard and FlexiTarget.
	*/
	import FlexiBoard from './flexi-board.svelte';
	import FlexiTarget from './flexi-target.svelte';

	let {
		direction = 'vertical',
		key = 'list',
		class: className,
		containerClass,
		boardClass,
		config,
		targetConfig,
		controller = $bindable(),
		onfirstcreate,
		children
	}: FlexiSortableProps = $props();

	const boardConfig = $derived<FlexiBoardConfiguration<ClassValue>>({
		...config,
		widgetDefaults: { draggability: 'full', ...config?.widgetDefaults }
	});

	const listConfig = $derived<FlexiTargetPartialConfiguration<ClassValue>>({
		...targetConfig,
		layout:
			direction === 'vertical'
				? { type: 'flow', flowAxis: 'row', placementStrategy: 'append', columns: 1 }
				: { type: 'flow', flowAxis: 'column', placementStrategy: 'append', rows: 1 }
	});
</script>

<FlexiBoard class={boardClass} config={boardConfig} bind:controller {onfirstcreate}>
	<FlexiTarget {key} class={className} {containerClass} config={listConfig}>
		{@render children?.()}
	</FlexiTarget>
</FlexiBoard>
