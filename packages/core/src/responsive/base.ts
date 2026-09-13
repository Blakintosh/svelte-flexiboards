import type { FlexiLayout } from '../board/types.js';
import type { ResponsiveFlexiLayout } from './types.js';

/**
 * Public interface for the ResponsiveFlexiBoard controller.
 * Manages multiple FlexiBoard layouts across different viewport breakpoints.
 */
export interface ResponsiveFlexiBoardController {
	/**
	 * The currently active breakpoint key.
	 */
	readonly currentBreakpoint: string;

	/**
	 * All breakpoint keys that have stored layouts.
	 */
	readonly definedBreakpoints: string[];

	/**
	 * All breakpoint keys from configuration.
	 */
	readonly configuredBreakpoints: string[];

	/**
	 * Imports layouts for all breakpoints.
	 * @param layout The responsive layout to import.
	 */
	importLayout(layout: ResponsiveFlexiLayout): void;

	/**
	 * Exports layouts for all breakpoints.
	 * @returns The complete responsive layout.
	 */
	exportLayout(): ResponsiveFlexiLayout;

	/**
	 * Gets the layout for a specific breakpoint.
	 * @param breakpoint The breakpoint key.
	 */
	getLayoutForBreakpoint(breakpoint: string): FlexiLayout | undefined;

	/**
	 * Sets the layout for a specific breakpoint.
	 * @param breakpoint The breakpoint key.
	 * @param layout The layout to set.
	 */
	setLayoutForBreakpoint(breakpoint: string, layout: FlexiLayout): void;

	/**
	 * Checks if a layout exists for a specific breakpoint.
	 * @param breakpoint The breakpoint key.
	 */
	hasLayoutForBreakpoint(breakpoint: string): boolean;
}
