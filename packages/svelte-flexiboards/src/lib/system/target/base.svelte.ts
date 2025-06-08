import type { SvelteSet } from 'svelte/reactivity';
import type { FlexiTargetConfiguration } from './types.js';
import type { WidgetAction, WidgetGrabbedParams, WidgetStartResizeParams } from '../types.js';
import type { FlexiWidgetController } from '../widget/base.svelte.js';
import type { FlexiWidgetConfiguration, FlexiWidgetDefaults } from '../widget/types.js';

export interface FlexiTargetController {
	/**
	 * The widgets currently in this target.
	 */
	widgets: SvelteSet<FlexiWidgetController>;

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
	 * Deletes the given widget from this target, if it exists.
	 * @returns Whether the widget was deleted.
	 */
	deleteWidget(widget: FlexiWidgetController): boolean;

	// NEXT: Add import/export layout.
	// /**
	//  * Imports a layout of widgets into this target, replacing any existing widgets.
	//  * @param layout The layout to import.
	//  */
	// importLayout(layout: FlexiWidgetConfiguration[]): void;

	// /**
	//  * Exports the current layout of widgets from this target.
	//  * @returns The layout of widgets.
	//  */
	// exportLayout(): FlexiWidgetConfiguration[];

	/**
	 * Restores the target to its pre-grab state.
	 * @remarks This is not intended for external use.
	 */
	restorePreGrabSnapshot(): void;

	/**
	 * Forgets the pre-grab state of the target.
	 * @remarks This is not intended for external use.
	 */
	forgetPreGrabSnapshot(): void;

	/**
	 * Cancels the current drop action.
	 */
	cancelDrop(): void;

	/**
	 * Applies any post-completion operations like row/column collapsing.
	 */
	applyGridPostCompletionOperations(): void;

	/**
	 * Attempts to drop a widget into this target.
	 * @param widget The widget to drop.
	 * @returns Whether the widget was dropped.
	 */
	tryDropWidget(widget: FlexiWidgetController): boolean;

	/**
	 * Grabs a widget.
	 * @param params The parameters for the grab action.
	 * @returns The action that was started, or null if the action couldn't be started.
	 */
	grabWidget(params: WidgetGrabbedParams): WidgetAction | null;

	/**
	 * Starts resizing a widget.
	 * @param params The parameters for the resize action.
	 * @returns The action that was started, or null if the action couldn't be started.
	 */
	startResizeWidget(params: WidgetStartResizeParams): WidgetAction | null;

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
}
