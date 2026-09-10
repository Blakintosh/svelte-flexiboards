<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import type {
		FlexiBoardConfiguration,
		FlexiBoardController,
		FlexiCommonProps,
		FlexiTargetPartialConfiguration
	} from '@flexiboards/core';

	export type FlexiDashboardProps = FlexiCommonProps<FlexiBoardController> & {
		/**
		 * Columns in the grid.
		 * @default 4
		 */
		columns?: number;

		/**
		 * Rows the grid starts with.
		 * @default 3
		 */
		rows?: number;

		/**
		 * Rows the grid may grow to as widgets are pushed down.
		 * @default rows
		 */
		maxRows?: number;

		/**
		 * Let widgets be resized from their FlexiResize handles.
		 * @default false
		 */
		resizable?: boolean;

		/**
		 * The target key, used when a layout is exported or imported.
		 * @default 'dashboard'
		 */
		key?: string;

		/**
		 * Classes for the grid element (the place for `gap-*`).
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
		 * Board configuration merged over the preset's defaults.
		 */
		config?: FlexiBoardConfiguration<ClassValue>;

		/**
		 * Target configuration merged over the preset's. The layout comes from
		 * `columns`, `rows` and `maxRows`.
		 */
		targetConfig?: Omit<FlexiTargetPartialConfiguration<ClassValue>, 'layout'>;

		/**
		 * The tiles: FlexiWidget declarations with `x`, `y`, `width`, `height`.
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	/*
	  A dashboard is one free-form target on one board. This preset turns the
	  min/max column and row settings into `columns`, `rows` and `maxRows`, and
	  a `resizable` switch; everything else is the underlying components.
	*/
	import FlexiBoard from './flexi-board.svelte';
	import FlexiTarget from './flexi-target.svelte';

	let {
		columns = 4,
		rows = 3,
		maxRows,
		resizable = false,
		key = 'dashboard',
		class: className,
		containerClass,
		boardClass,
		config,
		targetConfig,
		controller = $bindable(),
		onfirstcreate,
		children
	}: FlexiDashboardProps = $props();

	const boardConfig = $derived<FlexiBoardConfiguration<ClassValue>>({
		...config,
		widgetDefaults: {
			draggability: 'full',
			resizability: resizable ? 'both' : 'none',
			...config?.widgetDefaults
		}
	});

	const gridConfig = $derived<FlexiTargetPartialConfiguration<ClassValue>>({
		...targetConfig,
		layout: {
			type: 'free',
			minColumns: columns,
			maxColumns: columns,
			minRows: rows,
			maxRows: maxRows ?? rows
		}
	});
</script>

<FlexiBoard class={boardClass} config={boardConfig} bind:controller {onfirstcreate}>
	<FlexiTarget {key} class={className} {containerClass} config={gridConfig}>
		{@render children?.()}
	</FlexiTarget>
</FlexiBoard>
