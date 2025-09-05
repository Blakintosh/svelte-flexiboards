// Reexport your entry components here

// Components
import FlexiBoard, { type FlexiBoardProps } from './components/flexi-board.svelte';
import FlexiTarget, { type FlexiTargetProps } from './components/flexi-target.svelte';
import FlexiWidget, { type FlexiWidgetProps } from './components/flexi-widget.svelte';
import FlexiGrab from './components/flexi-grab.svelte';
import FlexiResize from './components/flexi-resize.svelte';
import FlexiAdd from './components/flexi-add.svelte';
import FlexiDelete from './components/flexi-delete.svelte';

// System
import type { FlexiBoardConfiguration, FlexiBoardController } from './system/board/index.js';
import type { FlexiTargetConfiguration, FlexiTargetController } from './system/target/index.js';

import {
	type FlexiWidgetController,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetChildrenSnippetParameters,
	type FlexiWidgetConfiguration,
	type FlexiWidgetTransitionConfiguration,
	type FlexiWidgetTransitionTypeConfiguration,
	type FlexiWidgetTriggerConfiguration,
	simpleTransitionConfig,
	getFlexiwidgetCtx
} from './system/widget/index.js';

import type {
	AdderWidgetConfiguration,
	FlexiAddController,
	FlexiAddWidgetFn
} from './system/misc/adder.svelte.js';
import {
	immediateTriggerConfig,
	longPressTriggerConfig,
	type PointerTriggerCondition
} from './system/widget/triggers.svelte.js';
import type { FlexiLayout, FlexiRegistryEntry, FlexiWidgetLayoutEntry } from './system/board/types.js';
export * from './system/types.js';

export {
	FlexiBoard,
	type FlexiBoardConfiguration,
	type FlexiBoardProps,
	type FlexiLayout,
	type FlexiWidgetLayoutEntry,
	type FlexiRegistryEntry,
	FlexiTarget,
	type FlexiTargetConfiguration,
	type FlexiTargetProps,
	FlexiWidget,
	type FlexiWidgetConfiguration,
	type FlexiWidgetProps,
	FlexiGrab,
	FlexiResize,
	FlexiAdd,
	FlexiDelete,
	type FlexiAddWidgetFn,
	type AdderWidgetConfiguration,
	type FlexiWidgetController,
	type FlexiBoardController,
	type FlexiTargetController,
	type FlexiAddController,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetChildrenSnippetParameters,
	type PointerTriggerCondition,
	type FlexiWidgetTriggerConfiguration,
	type FlexiWidgetTransitionTypeConfiguration,
	type FlexiWidgetTransitionConfiguration,
	immediateTriggerConfig,
	longPressTriggerConfig,
	getFlexiwidgetCtx,
	simpleTransitionConfig
};
