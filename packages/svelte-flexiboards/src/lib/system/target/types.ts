import type { FreeFormTargetLayout } from '../grid/free-grid.svelte.js';
import type { FlexiGrid, FlowTargetLayout } from '../grid/index.js';
import type { WidgetAction } from '../types.js';
import type { FlexiWidgetController } from '../widget/base.svelte.js';
import type { FlexiWidgetDefaults } from '../widget/types.js';
import type { FlexiTargetController } from './base.svelte.js';

export type FlexiTargetActionWidget = {
	action: WidgetAction['action'];
	widget: FlexiWidgetController;
};

export type FlexiTargetState = {
	/**
	 * Whether the target is currently being hovered over by the mouse.
	 */
	hovered: boolean;

	/**
	 * When set, this indicates a widget action that is currently being performed (or is focused) on this target.
	 */
	actionWidget: FlexiTargetActionWidget | null;

	/**
	 * Whether the target is mounted and ready to render widgets.
	 */
	prepared: boolean;
};

type TargetSizingFn = ({
	target,
	grid
}: {
	target: FlexiTargetController;
	grid: FlexiGrid;
}) => string;
export type TargetSizing = TargetSizingFn | string;

export type FlexiTargetDefaults = {
	/**
	 * Allows the specifying of the value inside the `repeat()` function of the `grid-template-rows` CSS property for the target.
	 */
	rowSizing?: TargetSizing;
	/**
	 * Allows the specifying of the value inside the `repeat()` function of the `grid-template-columns` CSS property for the target.
	 */
	columnSizing?: TargetSizing;

	/**
	 * The layout algorithm and parameters to use for the target grid.
	 */
	layout?: TargetLayout;
};

type RequiredFlexiTargetProperties = Required<FlexiTargetDefaults>;

export type FlexiTargetPartialConfiguration = FlexiTargetDefaults & {
	widgetDefaults?: FlexiWidgetDefaults;
};

export type FlexiTargetConfiguration = RequiredFlexiTargetProperties & {
	widgetDefaults?: FlexiWidgetDefaults;
};

export type TargetLayout = FlowTargetLayout | FreeFormTargetLayout;
