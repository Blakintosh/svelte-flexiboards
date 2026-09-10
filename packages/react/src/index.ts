// Components
export { FlexiBoard, type FlexiBoardProps } from './components/flexi-board.js';
export type { FlexiBoardSuspenseReason } from './components/flexi-suspense-boundary.js';
export { FlexiTarget, type FlexiTargetProps } from './components/flexi-target.js';
export { FlexiGrab } from './components/flexi-grab.js';
export { FlexiResize } from './components/flexi-resize.js';
export { FlexiAdd, type FlexiAddProps } from './components/flexi-add.js';
export { FlexiDelete, type FlexiDeleteProps } from './components/flexi-delete.js';
export {
	ResponsiveFlexiBoard,
	type ResponsiveFlexiBoardProps
} from './components/responsive-flexi-board.js';
export { FlexiWidget, type FlexiWidgetProps } from './components/flexi-widget.js';

// Presets: one board and one target with the layout chosen for you.
export { FlexiSortable, type FlexiSortableProps } from './components/flexi-sortable.js';
export { FlexiDashboard, type FlexiDashboardProps } from './components/flexi-dashboard.js';

// Adapter context hooks
export { useFlexiBoard } from './adapters/board.js';
export { useFlexiTarget } from './adapters/target.js';
export { useFlexiWidget } from './adapters/widget.js';
export { useFlexiAdd } from './adapters/misc.js';
export { useResponsiveFlexiBoard } from './adapters/responsive.js';

// Reactivity bridge
export { useFromCore } from './adapter.js';
export { useReactive } from './adapters/reactive.js';
export type { FlexiChildren, FlexiCommonProps } from './adapters/utils.js';
export type { FlexiWidgetChildren, FlexiWidgetSubProps } from './adapters/widget.js';

// Core-provided configuration helpers
export {
	immediateTriggerConfig,
	longPressTriggerConfig,
	cssTransitionConfig,
	simpleTransitionConfig,
	springTransitionConfig,
	cssTransition,
	spring
} from '@flexiboards/core';

// All public types come from core; the React-specific component prop types
// exported above shadow their core namesakes where both exist.
export type * from '@flexiboards/core';

// React instantiations of core's class-generic types and render types.
export type {
	AdderWidgetConfiguration,
	FlexiAddClasses,
	FlexiAddClassFunction,
	FlexiAddWidgetFn,
	FlexiBoardConfiguration,
	FlexiDeleteClasses,
	FlexiDeleteClassFunction,
	FlexiRegistryEntry,
	FlexiTargetConfiguration,
	FlexiTargetPartialConfiguration,
	FlexiWidgetClasses,
	FlexiWidgetClassFunction,
	FlexiWidgetConfiguration,
	FlexiWidgetDefaults
} from './types.js';
