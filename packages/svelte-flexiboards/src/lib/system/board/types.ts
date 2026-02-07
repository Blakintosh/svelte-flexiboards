import type { FlexiTargetDefaults } from '../target/types.js';
import type { FlexiWidgetDefaults } from '../widget/types.js';

export type FlexiLayoutChangeFn = (layout: FlexiLayout) => void;

export type FlexiBoardConfiguration = {
	widgetDefaults?: FlexiWidgetDefaults;
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
	registry?: Record<string, FlexiRegistryEntry>;
	loadLayout?: FlexiLoadLayoutFn;
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