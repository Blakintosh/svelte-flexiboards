import type { WidgetAction } from '../types.js';
import type { FlexiTargetController } from '../target/base.js';
import type { FlexiWidgetController } from '../widget/base.js';
import type { FlexiLayout, FlexiLayoutEnvelope } from './types.js';

export interface FlexiBoardController {
	/**
	 * The reactive styling to apply to the board's root element.
	 */
	style: string;

	/**
	 * The reactive DOM reference to the board's root element.
	 */
	ref: HTMLElement | undefined;

	/**
	 * The breakpoint that the board corresponds to, if the board is responsive.
	 */
	readonly breakpoint?: string;

	/**
	 * Whether the board's rendered layout is provisional: a `loadLayout` (or
	 * `loadLayouts`) is configured but hasn't run yet. True throughout a server
	 * render and during hydration until the stored layout is imported.
	 * Adapters expose it in the markup (`data-flexi-pending="layout"`) so a
	 * skeleton or veil can cover the stand-in layout.
	 */
	readonly layoutPending: boolean;

	/**
	 * The breakpoint this render is assuming without confirmation, or null once
	 * it's real. Non-null only for a board under a ResponsiveFlexiBoard during
	 * a server render, where the rendered breakpoint is a guess. Adapters emit
	 * it as `data-flexi-pending="<key>"` (unless layoutPending takes priority)
	 * so a stylesheet can veil the board only when the viewport doesn't match
	 * the guess.
	 */
	readonly breakpointPending: string | null;

	/**
	 * The move or resize the user is in the middle of, or null when idle.
	 * Reactive: read it during render to react to a drag starting and ending.
	 */
	readonly currentWidgetAction: WidgetAction | null;

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

	/**
	 * Imports a widget layout into the board: a bare layout, or the
	 * `{ version, layout }` envelope that `exportLayoutEnvelope()` returns.
	 * @param layout The widget layout to import.
	 */
	importLayout(layout: FlexiLayout | FlexiLayoutEnvelope): void;

	/**
	 * Exports the current widget layout of the board.
	 * @returns The current widget layout of the board.
	 */
	exportLayout(): FlexiLayout;

	/**
	 * Exports the layout with its format version, the shape to persist so a
	 * later release can migrate it on import.
	 */
	exportLayoutEnvelope(): FlexiLayoutEnvelope;

	/**
	 * Deletes every widget in every target of this board. Fires `onWidgetDelete`
	 * per widget and `onLayoutChange` once.
	 */
	clear(): void;
}
