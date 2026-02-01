import type { FlexiLayout } from "../board/types.js";

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
     * Function to load initial layouts on mount.
     * Called once when the responsive board is ready.
     */
    loadLayouts?: ResponsiveFlexiLoadLayoutFn;
};