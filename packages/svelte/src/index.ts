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
	simpleTransitionConfig,
	cssTransition,
	spring
} from '@flexiboards/core';

// All public types come from core; the Svelte-specific component prop types
// exported below shadow their core namesakes where both exist.
export type * from '@flexiboards/core';

// Svelte instantiations of core's class-generic types: class values are
// Svelte's ClassValue (strings, arrays, records — resolved natively by
// class={...}). These explicit aliases shadow the bare (unknown-instantiated)
// star re-exports above, so consumers annotating with these names never see
// the generic.
import type { ClassValue } from 'svelte/elements';
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

export type AdderWidgetConfiguration = CoreAdderWidgetConfiguration<ClassValue>;
export type FlexiAddClasses = CoreFlexiAddClasses<ClassValue>;
export type FlexiAddClassFunction = CoreFlexiAddClassFunction<ClassValue>;
export type FlexiAddWidgetFn = CoreFlexiAddWidgetFn<ClassValue>;
export type FlexiBoardConfiguration = CoreFlexiBoardConfiguration<ClassValue>;
export type FlexiDeleteClasses = CoreFlexiDeleteClasses<ClassValue>;
export type FlexiDeleteClassFunction = CoreFlexiDeleteClassFunction<ClassValue>;
export type FlexiRegistryEntry = CoreFlexiRegistryEntry<ClassValue>;
export type FlexiTargetConfiguration = CoreFlexiTargetConfiguration<ClassValue>;
export type FlexiTargetPartialConfiguration = CoreFlexiTargetPartialConfiguration<ClassValue>;
export type FlexiWidgetClasses = CoreFlexiWidgetClasses<ClassValue>;
export type FlexiWidgetClassFunction = CoreFlexiWidgetClassFunction<ClassValue>;
export type FlexiWidgetConfiguration = CoreFlexiWidgetConfiguration<ClassValue>;
export type FlexiWidgetDefaults = CoreFlexiWidgetDefaults<ClassValue>;

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
	cssTransition,
	spring,
	getFlexiwidgetCtx
};
