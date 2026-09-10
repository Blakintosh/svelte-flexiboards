// React instantiations of core's class-generic types: class values are plain
// strings here (compose with clsx/cn on the consumer side). These explicit
// aliases shadow the bare (unknown-instantiated) star re-exports above, so
// consumers annotating with these names never see the generic.
import type {
	AdderWidgetConfiguration as CoreAdderWidgetConfiguration,
	FlexiAddClasses as CoreFlexiAddClasses,
	FlexiAddClassFunction as CoreFlexiAddClassFunction,
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

// Core stores a widget's render types opaquely (`unknown`); here they are a
// React component and a children render function, so configs written for
// createWidget()/registries/widgetDefaults are type-checked.
import type { ComponentType } from 'react';
import type { FlexiWidgetChildren } from './adapters/widget.js';
type ReactRender = {
	/** The component rendered by this widget, receiving `componentProps`. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any props, as the consumer chooses
	component?: ComponentType<any>;
	/** The children render function for this widget; receives the reactive widget and its event handlers. */
	snippet?: FlexiWidgetChildren;
};
type WithReactRender<T> = Omit<T, 'component' | 'snippet'> & ReactRender;

export type FlexiWidgetConfiguration = WithReactRender<CoreFlexiWidgetConfiguration<string>>;
export type FlexiRegistryEntry = WithReactRender<CoreFlexiRegistryEntry<string>>;
export type FlexiWidgetDefaults = WithReactRender<CoreFlexiWidgetDefaults<string>>;
export type AdderWidgetConfiguration = Omit<CoreAdderWidgetConfiguration<string>, 'widget'> & {
	/** The configuration of the widget that is created and grabbed. */
	widget: FlexiWidgetConfiguration;
};
export type FlexiAddClasses = CoreFlexiAddClasses<string>;
export type FlexiAddClassFunction = CoreFlexiAddClassFunction<string>;
export type FlexiAddWidgetFn = () => AdderWidgetConfiguration | null;
export type FlexiBoardConfiguration = Omit<
	CoreFlexiBoardConfiguration<string>,
	'widgetDefaults' | 'registry'
> & {
	/** The default configuration for widgets within this board. */
	widgetDefaults?: FlexiWidgetDefaults;
	/** The widget registry, keyed by widget `type`, used when importing layouts. */
	registry?: Record<string, FlexiRegistryEntry>;
};
export type FlexiDeleteClasses = CoreFlexiDeleteClasses<string>;
export type FlexiDeleteClassFunction = CoreFlexiDeleteClassFunction<string>;
export type FlexiTargetConfiguration = Omit<
	CoreFlexiTargetConfiguration<string>,
	'widgetDefaults'
> & {
	/** The default configuration for widgets within this target. */
	widgetDefaults?: FlexiWidgetDefaults;
};
export type FlexiTargetPartialConfiguration = Omit<
	CoreFlexiTargetPartialConfiguration<string>,
	'widgetDefaults'
> & {
	/** The default configuration for widgets within this target. */
	widgetDefaults?: FlexiWidgetDefaults;
};
export type FlexiWidgetClasses = CoreFlexiWidgetClasses<string>;
export type FlexiWidgetClassFunction = CoreFlexiWidgetClassFunction<string>;
