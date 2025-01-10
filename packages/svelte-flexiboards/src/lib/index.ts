// Reexport your entry components here
import FlexiBoard, { type FlexiBoardProps } from "./components/flexi-board.svelte";
import FlexiTarget, { type FlexiTargetProps } from "./components/flexi-target.svelte";
import FlexiWidget, { type FlexiWidgetProps } from "./components/flexi-widget.svelte";
import FlexiGrab from "./components/flexi-grab.svelte";
import FlexiResize from "./components/flexi-resize.svelte";
import FlexiAdd from "./components/flexi-add.svelte";
import FlexiDelete from "./components/flexi-delete.svelte";
import type { FlexiBoardConfiguration } from "./system/provider.svelte.js";
import type { FlexiTargetConfiguration } from "./system/target.svelte.js";
import type { FlexiWidgetChildrenSnippet, FlexiWidgetChildrenSnippetParameters, FlexiWidgetConfiguration } from "./system/widget.svelte.js";
import type { FlexiBoardController } from "./system/provider.svelte.js";
import type { FlexiTargetController } from "./system/target.svelte.js";
import type { FlexiWidgetController } from "./system/widget.svelte.js";
import type { AdderWidgetConfiguration, FlexiAddController, FlexiAddWidgetFn } from "./system/manage.svelte.js";
export * from "./system/types.js";

export {
	FlexiBoard,
	type FlexiBoardConfiguration,
	type FlexiBoardProps,
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
	type FlexiWidgetChildrenSnippetParameters
};
