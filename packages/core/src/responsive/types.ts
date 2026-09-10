import type { FlexiLayout } from '../board/types.js';
import type { FlexiCommonProps } from '../types.js';
import type { ResponsiveFlexiBoardController } from './base.js';

export type ResponsiveFlexiBoardProps = FlexiCommonProps<ResponsiveFlexiBoardController> & {
	config?: ResponsiveFlexiBoardConfiguration;
};

/**
 * A responsive layout is a map of breakpoint keys to FlexiBoard layouts.
 *
 * @example
 * ```ts
 * const layout: ResponsiveFlexiLayout = {
 *   lg: { "target-0": [{ type: "widget", x: 0, y: 0, width: 4, height: 2 }] },
 *   md: { "target-0": [{ type: "widget", x: 0, y: 0, width: 6, height: 2 }] },
 *   default: { "target-0": [{ type: "widget", x: 0, y: 0, width: 12, height: 2 }] },
 * };
 * ```
 */
export type ResponsiveFlexiLayout = {
	[breakpoint: string]: FlexiLayout;
};

/**
 * Callback fired when any breakpoint's layout changes.
 */
export type ResponsiveFlexiLayoutChangeFn = (layouts: ResponsiveFlexiLayout) => void;

/**
 * Function to load initial layouts for all breakpoints.
 */
export type ResponsiveFlexiLoadLayoutFn = () => ResponsiveFlexiLayout | undefined;

export type ResponsiveFlexiBoardConfiguration = {
	/**
	 * Breakpoint definitions mapping breakpoint keys to minimum viewport widths (in pixels).
	 * Breakpoints are evaluated in descending order - the largest matching breakpoint wins.
	 * Use 'default' as the fallback when no breakpoint matches.
	 *
	 * @example
	 * ```ts
	 * breakpoints: {
	 *   lg: 1200,  // >= 1200px
	 *   md: 900,   // >= 900px
	 *   sm: 600,   // >= 600px
	 *   // 'default' is implicit for < 600px
	 * }
	 * ```
	 */
	breakpoints?: Record<string, number>;

	/**
	 * Callback fired when the active breakpoint changes.
	 */
	onBreakpointChange?: (newBreakpoint: string, oldBreakpoint: string) => void;

	/**
	 * Callback fired when any layout changes (widget moved, resized, added, or removed).
	 * Receives all breakpoint layouts, including the updated current one.
	 */
	onLayoutsChange?: ResponsiveFlexiLayoutChangeFn;

	/**
	 * Layouts to render from instead of the widgets declared in markup, as a
	 * plain value keyed by breakpoint. The active breakpoint's layout is
	 * applied during the initial render pass on both the server and the
	 * client, like FlexiBoardConfiguration.initialLayout. A configured
	 * `loadLayouts` still runs on the client and overrides this.
	 */
	initialLayouts?: ResponsiveFlexiLayout;

	/**
	 * Function to load initial layouts on mount.
	 * Called once when the responsive board is ready. Not invoked during
	 * server rendering. Use `initialLayouts` for layouts the server has.
	 */
	loadLayouts?: ResponsiveFlexiLoadLayoutFn;

	/**
	 * The breakpoint to assume while server-rendering, where no media query can
	 * match. Pick the most common viewport for the page (usually the desktop
	 * breakpoint); the client corrects to the real breakpoint at hydration.
	 * Without it, a server render falls back to the 'default' breakpoint.
	 */
	ssrBreakpoint?: string;
};
