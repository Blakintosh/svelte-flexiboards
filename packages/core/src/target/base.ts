import type { ReactiveSet } from '../shared/reactive-collections.js';
import type { FlexiTargetConfiguration } from './types.js';
import type { FlexiWidgetController } from '../widget/base.js';
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
	 * Whether a widget is currently being grabbed or resized over this target at a position
	 * where it cannot be placed. Use it to signal that the drop will be rejected.
	 */
	get dropRejected(): boolean;

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
	get widgets(): ReactiveSet<FlexiWidgetController>;
}
