// Reexport your entry components here
import FlexiBoard, { type FlexiBoardProps } from "./components/flexi-board.svelte";
import FlexiTarget, { type FlexiTargetProps } from "./components/flexi-target.svelte";
import FlexiWidget, { type FlexiWidgetProps } from "./components/flexi-widget.svelte";
import FlexiGrab from "./components/flexi-grab.svelte";
import type { FlexiBoardConfiguration } from "./system/provider.svelte.js";
import type { FlexiTargetConfiguration } from "./system/target.svelte.js";
import type { FlexiWidgetConfiguration } from "./system/widget.svelte.js";

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
	FlexiGrab
};
