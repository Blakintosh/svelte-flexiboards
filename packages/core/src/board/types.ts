import type { ClassValue, FlexiCommonProps } from '../types.js';
import type { FlexiTargetDefaults } from '../target/types.js';
import type { FlexiWidgetDefaults } from '../widget/types.js';
import type { FlexiBoardController } from './base.js';

export type FlexiBoardProps = FlexiCommonProps<FlexiBoardController> & {
	config?: FlexiBoardConfiguration;
	class?: ClassValue;
};

export type FlexiLayoutChangeFn = (layout: FlexiLayout) => void;

export type FlexiBoardConfiguration = {
	/**
	 * The default configuration for widgets within this board.
	 */
	widgetDefaults?: FlexiWidgetDefaults;

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
	registry?: Record<string, FlexiRegistryEntry>;

	/**
	 * Function to load an initial layout on mount. Called once when the board
	 * is ready.
	 */
	loadLayout?: FlexiLoadLayoutFn;

	/**
	 * Callback fired when the board's layout changes (widget moved, resized,
	 * added, or removed).
	 */
	onLayoutChange?: FlexiLayoutChangeFn;
};

export type FlexiRegistryEntry = Omit<FlexiWidgetDefaults, 'width' | 'height' | 'draggable'>;

export type FlexiWidgetLayoutEntry = {
	id?: string;
	type: string;
	x: number;
	y: number;
	width: number;
	height: number;
	metadata?: Record<string, any>;
};

export type FlexiLayout = Record<string, FlexiWidgetLayoutEntry[]>;

export type FlexiLoadLayoutFn = () => FlexiLayout | FlexiWidgetLayoutEntry[] | undefined;
