import type { FlexiTargetController } from '../target/base.svelte.js';
import type { FlexiWidgetController } from '../widget/base.svelte.js';

export interface FlexiBoardController {
	/**
	 * The reactive styling to apply to the board's root element.
	 */
	style: string;

	/**
	 * The reactive DOM reference to the board's root element.
	 */
	ref: HTMLElement | null;

	/**
	 * Moves an existing widget from one target to another.
	 * @param widget The widget to move.
	 * @param from The target to move the widget from.
	 * @param to The target to move the widget to.
	 */
	moveWidget(
		widget: FlexiWidgetController,
		from: FlexiTargetController | undefined,
		to: FlexiTargetController
	): void;

	// NEXT: Add import/export layout.
	/**
	 * Imports a widget layout into the board.
	 * @param layout The widget layout to import.
	 */
	// importLayout(layout: FlexiSavedLayout): void;

	/**
	 * Exports the current widget layout of the board.
	 * @returns The current widget layout of the board.
	 */
	// exportLayout(): FlexiSavedLayout;
}
