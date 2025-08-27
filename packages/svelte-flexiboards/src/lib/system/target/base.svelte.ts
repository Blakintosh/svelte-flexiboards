import type { SvelteSet } from 'svelte/reactivity';
import type { FlexiTargetConfiguration } from './types.js';
import type { WidgetAction, WidgetGrabbedParams, WidgetStartResizeParams } from '../types.js';
import type { FlexiWidgetController } from '../widget/base.svelte.js';
import type { FlexiWidgetConfiguration, FlexiWidgetDefaults } from '../widget/types.js';

export interface FlexiTargetController {
	/**
	 * The reactive configuration of the target.
	 */
	config: FlexiTargetConfiguration;

	/**
	 * The reactive default widget configuration passed through from the provider, if it exists.
	 */
	providerWidgetDefaults?: FlexiWidgetDefaults;

	/**
	 * Whether the target is prepared and ready to render widgets.
	 */
	get prepared(): boolean;

	/**
	 * Creates a new widget under this target.
	 * @param config The configuration of the widget to create.
	 * @returns The newly created widget if it could be placed, or undefined if not.
	 */
	createWidget(config: FlexiWidgetConfiguration): FlexiWidgetController | undefined;

	/**
	 * The number of columns currently being used in the target grid.
	 * This value is readonly.
	 */
	get columns(): number;

	/**
	 * The number of rows currently being used in the target grid.
	 * This value is readonly.
	 */
	get rows(): number;

	/**
	 * The widgets currently in this target.
	 */
	get widgets(): SvelteSet<FlexiWidgetController>;
}
