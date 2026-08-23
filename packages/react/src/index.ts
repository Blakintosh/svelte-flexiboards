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
	simpleTransitionConfig
} from '@flexiboards/core';

// All public types come from core; the React-specific component prop types
// exported above shadow their core namesakes where both exist.
export type * from '@flexiboards/core';
