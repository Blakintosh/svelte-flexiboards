import {
	getContext,
	onDestroy,
	onMount,
	setContext,
	untrack,
	type Component,
	type Snippet
} from 'svelte';
import {
	getInternalFlexitargetCtx,
	type InternalFlexiTargetController,
	type FlexiTargetConfiguration,
	type FlexiTargetController
} from './target.svelte.js';
import type {
	WidgetAction,
	WidgetGrabAction,
	WidgetResizeAction,
	WidgetResizability,
	Position,
	WidgetActionEvent,
	WidgetGrabbedEvent,
	WidgetResizingEvent
} from './types.js';
import type { FlexiAddController } from './manage.svelte.js';
import type { InternalFlexiBoardController } from './provider.svelte.js';
import {
	getElementMidpoint,
	getPointerService,
	immediateTriggerConfig,
	longPressTriggerConfig,
	PointerService,
	WidgetPointerEventWatcher,
	type PointerTriggerCondition
} from './shared/utils.svelte.js';
import type { ClassValue } from 'svelte/elements';
import { FlexiControllerBase } from './base.svelte.js';
import type { FlexiEventBus } from './event-bus.js';
