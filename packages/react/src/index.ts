// Components
export { FlexiBoard, type FlexiBoardProps } from './components/flexi-board.js';
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

// Adapter context hooks
export { useFlexiBoard } from './adapters/board.js';
export { useFlexiTarget } from './adapters/target.js';
export { useFlexiWidget } from './adapters/widget.js';
export { useFlexiAdd } from './adapters/misc.js';
export { useResponsiveFlexiBoard } from './adapters/responsive.js';

// Reactivity bridge
export { useFromCore } from './adapter.js';

// Core-provided configuration helpers
export {
	immediateTriggerConfig,
	longPressTriggerConfig,
	simpleTransitionConfig,
	cssTransition,
	spring
} from '@flexiboards/core';

// All public types come from core; the React-specific component prop types
// exported above shadow their core namesakes where both exist.
export type * from '@flexiboards/core';

// React instantiations of core's class-generic types: class values are plain
// strings here (compose with clsx/cn on the consumer side). These explicit
// aliases shadow the bare (unknown-instantiated) star re-exports above, so
// consumers annotating with these names never see the generic.
import type {
	AdderWidgetConfiguration as CoreAdderWidgetConfiguration,
	FlexiAddClasses as CoreFlexiAddClasses,
	FlexiAddClassFunction as CoreFlexiAddClassFunction,
	FlexiAddWidgetFn as CoreFlexiAddWidgetFn,
	FlexiBoardConfiguration as CoreFlexiBoardConfiguration,
	FlexiDeleteClasses as CoreFlexiDeleteClasses,
	FlexiDeleteClassFunction as CoreFlexiDeleteClassFunction,
	FlexiRegistryEntry as CoreFlexiRegistryEntry,
	FlexiTargetConfiguration as CoreFlexiTargetConfiguration,
	FlexiTargetPartialConfiguration as CoreFlexiTargetPartialConfiguration,
	FlexiWidgetClasses as CoreFlexiWidgetClasses,
	FlexiWidgetClassFunction as CoreFlexiWidgetClassFunction,
	FlexiWidgetConfiguration as CoreFlexiWidgetConfiguration,
	FlexiWidgetDefaults as CoreFlexiWidgetDefaults
} from '@flexiboards/core';

export type AdderWidgetConfiguration = CoreAdderWidgetConfiguration<string>;
export type FlexiAddClasses = CoreFlexiAddClasses<string>;
export type FlexiAddClassFunction = CoreFlexiAddClassFunction<string>;
export type FlexiAddWidgetFn = CoreFlexiAddWidgetFn<string>;
export type FlexiBoardConfiguration = CoreFlexiBoardConfiguration<string>;
export type FlexiDeleteClasses = CoreFlexiDeleteClasses<string>;
export type FlexiDeleteClassFunction = CoreFlexiDeleteClassFunction<string>;
export type FlexiRegistryEntry = CoreFlexiRegistryEntry<string>;
export type FlexiTargetConfiguration = CoreFlexiTargetConfiguration<string>;
export type FlexiTargetPartialConfiguration = CoreFlexiTargetPartialConfiguration<string>;
export type FlexiWidgetClasses = CoreFlexiWidgetClasses<string>;
export type FlexiWidgetClassFunction = CoreFlexiWidgetClassFunction<string>;
export type FlexiWidgetConfiguration = CoreFlexiWidgetConfiguration<string>;
export type FlexiWidgetDefaults = CoreFlexiWidgetDefaults<string>;
