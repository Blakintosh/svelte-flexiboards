import type { FlexiTargetController } from '../target/base.js';
import type { FlexiWidgetController } from '../widget/base.js';
import type { FlexiCommonProps } from '../types.js';
import type { FlexiTargetDefaults } from '../target/types.js';
import type { FlexiWidgetDefaults } from '../widget/types.js';
import type { FlexiBoardController } from './base.js';

export type FlexiBoardProps<TClass = unknown> = FlexiCommonProps<FlexiBoardController> & {
	config?: FlexiBoardConfiguration<TClass>;
	class?: TClass;
};

export type FlexiLayoutChangeFn = (layout: FlexiLayout) => void;

/** A widget and the target it is over (or came from), as handed to board callbacks. */
export type FlexiWidgetEvent = {
	widget: FlexiWidgetController;
	/** The target the widget is in or over. Undefined when it is over none (e.g. a cancelled adder drag). */
	target?: FlexiTargetController;
};

/** A completed drop: where the widget came from and where it landed. */
export type FlexiWidgetDropEvent = {
	widget: FlexiWidgetController;
	/** The target the widget was picked up from. Undefined for a widget added through an adder. */
	sourceTarget?: FlexiTargetController;
	/** The target the widget landed in. */
	target: FlexiTargetController;
};

/** A prospective placement the board is asked to allow or reject. */
export type FlexiDropCheck = {
	widget: FlexiWidgetController;
	target: FlexiTargetController;
	x: number;
	y: number;
	width: number;
	height: number;
};

export type FlexiBoardConfiguration<TClass = unknown> = {
	/**
	 * The default configuration for widgets within this board.
	 */
	widgetDefaults?: FlexiWidgetDefaults<TClass>;

	/**
	 * The default configuration for targets within this board.
	 */
	targetDefaults?: FlexiTargetDefaults;
	/**
	 * Optional breakpoint override.
	 *
	 * When this board is inside a ResponsiveFlexiBoard, the breakpoint is automatically
	 * inferred from the responsive controller's `currentBreakpoint`. You typically don't
	 * need to set this manually.
	 *
	 * If set outside of a ResponsiveFlexiBoard context, a warning will be logged.
	 */
	breakpoint?: string;

	/**
	 * A registry of widget types, mapping type keys to shared widget
	 * configuration. Widgets reference an entry via their `type`.
	 */
	registry?: Record<string, FlexiRegistryEntry<TClass>>;

	/**
	 * A layout to render from instead of the widgets declared in markup, as a
	 * plain value keyed by target. Applied during the initial render pass on
	 * both the server and the client, so a layout fetched in a server `load`
	 * (e.g. from a database) server-renders at its final positions with no
	 * pending window. Requires a `registry` to resolve each entry's `type`.
	 * Targets without an entry here fall back to their declared widgets. A
	 * configured `loadLayout` still runs on the client and overrides this.
	 */
	initialLayout?: FlexiLayout;

	/**
	 * Function to load an initial layout on mount. Called once when the board
	 * is ready. Not invoked during server rendering. Use `initialLayout` for
	 * layouts the server already has.
	 */
	loadLayout?: FlexiLoadLayoutFn;

	/**
	 * Callback fired when the board's layout changes (widget moved, resized,
	 * added, or removed), whether by the user or through the controller API.
	 * Debounced; receives the exported layout.
	 */
	onLayoutChange?: FlexiLayoutChangeFn;

	/**
	 * Called when the user picks a widget up (by pointer or keyboard).
	 */
	onWidgetGrab?: (event: FlexiWidgetEvent) => void;

	/**
	 * Called when a widget the user was moving or resizing lands in a target.
	 * Fires after the placement is committed, so the widget's `x`, `y`, `width`,
	 * `height` and `target` are already final.
	 */
	onWidgetDrop?: (event: FlexiWidgetDropEvent) => void;

	/**
	 * Called when the user cancels a move or resize (Escape, or releasing where
	 * nothing accepts the widget); the widget is back where it started.
	 */
	onWidgetCancel?: (event: FlexiWidgetEvent) => void;

	/**
	 * Called when a widget is deleted, by dropping it on a FlexiDelete or by
	 * calling `widget.delete()`.
	 */
	onWidgetDelete?: (event: FlexiWidgetEvent) => void;

	/**
	 * Called when a resize the user was making commits. The widget's `width`
	 * and `height` are already final.
	 */
	onWidgetResize?: (event: FlexiWidgetEvent) => void;

	/**
	 * Called when a widget being moved is carried over a target, which then
	 * shows a drop preview for it.
	 */
	onWidgetEnterTarget?: (event: FlexiWidgetEvent) => void;

	/**
	 * Called when a widget being moved leaves the target it was over.
	 */
	onWidgetLeaveTarget?: (event: FlexiWidgetEvent) => void;

	/**
	 * Decides whether a widget may be placed at a position. Called while the
	 * user hovers (so the drop preview can show a rejection) and again on
	 * release. Return false to refuse: the widget stays where it was.
	 * Placement rules the grid already enforces (bounds, collisions) run
	 * regardless.
	 */
	canDrop?: (check: FlexiDropCheck) => boolean;

	/**
	 * Hosts drop flights in the fixed, viewport-level portal instead of flying
	 * them inside the board. Reach for this when drops are released outside the
	 * board's box and must fly in across its edge without clipping under the
	 * board's overflow lock (e.g. a small hero board mid-page). Leave it off for
	 * scrollable boards: a portalled flight escapes the scroll container's clip
	 * and paints above surrounding chrome for its duration.
	 *
	 * @default false
	 */
	portalDropFlights?: boolean;

	/**
	 * Scrolls the board's scrollable ancestors (the page included) while a drag
	 * or resize hovers within 48px of their visible edge. Turn it off for
	 * boards that sit on a page where a drag should never move the viewport
	 * (e.g. a marketing hero). An unexpected page scroll mid-drag reads as the
	 * board jumping.
	 *
	 * @default true
	 */
	autoScroll?: boolean;
};

export type FlexiRegistryEntry<TClass = unknown> = Omit<
	FlexiWidgetDefaults<TClass>,
	'width' | 'height'
>;

export type FlexiWidgetLayoutEntry = {
	/**
	 * A stable identifier for this widget. Always present in an export: the id you
	 * gave the widget, or a generated one. Round-trips through import.
	 */
	id?: string;
	/**
	 * The registry key that says how to render this widget. Exported even when
	 * absent, so no widget's position is lost; on import, entries without a type
	 * are skipped, since nothing says how to render them.
	 */
	type?: string;
	/** The column the widget starts at, zero-indexed. */
	x: number;
	/** The row the widget starts at, zero-indexed. */
	y: number;
	/** The width of the widget in grid units. */
	width: number;
	/** The height of the widget in grid units. */
	height: number;
	/** Custom serialisable data attached to the widget, preserved through export and import. */
	metadata?: Record<string, any>;
};

export type FlexiLayout = Record<string, FlexiWidgetLayoutEntry[]>;

/**
 * The layout format version this release exports. Store it next to a layout
 * (see FlexiLayoutEnvelope) so a later release can migrate what it reads.
 */
export const LAYOUT_FORMAT_VERSION = 1;

/**
 * A layout with its format version, the shape to persist. `importLayout` and
 * `loadLayout` accept this as well as a bare FlexiLayout.
 */
export type FlexiLayoutEnvelope = {
	version: number;
	layout: FlexiLayout;
};

export function isLayoutEnvelope(value: unknown): value is FlexiLayoutEnvelope {
	return (
		typeof value === 'object' &&
		value !== null &&
		'version' in value &&
		'layout' in value &&
		typeof (value as FlexiLayoutEnvelope).version === 'number'
	);
}

export type FlexiLoadLayoutFn = () =>
	| FlexiLayout
	| FlexiLayoutEnvelope
	| FlexiWidgetLayoutEntry[]
	| undefined;
