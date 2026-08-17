// Components
import FlexiBoard, { type FlexiBoardProps } from './components/flexi-board.svelte';
import FlexiTarget, { type FlexiTargetProps } from './components/flexi-target.svelte';
import FlexiWidget, { type FlexiWidgetProps } from './components/flexi-widget.svelte';
import FlexiGrab from './components/flexi-grab.svelte';
import FlexiResize from './components/flexi-resize.svelte';
import FlexiAdd from './components/flexi-add.svelte';
import FlexiDelete from './components/flexi-delete.svelte';
import ResponsiveFlexiBoard, {
	type BreakpointSnippetParams,
	type ResponsiveFlexiBoardProps
} from './components/responsive-flexi-board.svelte';

// Adapter context getters
import { getFlexiwidgetCtx } from './adapters/widget.js';

// Core-provided configuration helpers
import {
	immediateTriggerConfig,
	longPressTriggerConfig,
	simpleTransitionConfig
} from '@flexiboards/core';

// All public types come from core; the Svelte-specific component prop types
// exported below shadow their core namesakes where both exist.
export type * from '@flexiboards/core';

export {
	FlexiBoard,
	type FlexiBoardProps,
	FlexiTarget,
	type FlexiTargetProps,
	FlexiWidget,
	type FlexiWidgetProps,
	FlexiGrab,
	FlexiResize,
	FlexiAdd,
	FlexiDelete,
	ResponsiveFlexiBoard,
	type ResponsiveFlexiBoardProps,
	type BreakpointSnippetParams,
	immediateTriggerConfig,
	longPressTriggerConfig,
	simpleTransitionConfig,
	getFlexiwidgetCtx
};
