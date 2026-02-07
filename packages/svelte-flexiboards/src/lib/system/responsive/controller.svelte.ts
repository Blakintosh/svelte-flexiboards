import { MediaQuery, SvelteMap } from 'svelte/reactivity';
import type { FlexiLayout } from '../board/types.js';
import type { ResponsiveFlexiBoardController } from './base.svelte.js';
import type { ResponsiveFlexiBoardConfiguration, ResponsiveFlexiLayout } from './types.js';
import type { ResponsiveFlexiBoardProps } from '$lib/components/responsive-flexi-board.svelte';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import type { BoardLayoutChangeEvent } from '../types.js';
import type { InternalFlexiBoardController } from '../board/controller.svelte.js';

const DEFAULT_BREAKPOINT = 'default';

export class InternalResponsiveFlexiBoardController implements ResponsiveFlexiBoardController {
	#rawProps?: ResponsiveFlexiBoardProps = $state(undefined);
	config?: ResponsiveFlexiBoardConfiguration = $derived(this.#rawProps?.config);

	/**
	 * Stored layouts for all breakpoints.
	 * This is the source of truth - active board syncs to/from this.
	 */
	#storedLayouts: ResponsiveFlexiLayout = $state({});

	/**
	 * Whether initial layout loading has completed.
	 */
	#ready: boolean = false;

	/**
	 * Debounce timer for layout change callbacks.
	 */
	#layoutChangeTimeout: ReturnType<typeof setTimeout> | null = null;
	#layoutChangeDebounceMs = 150;

	/**
	 * Whether initial layouts have been imported via importLayout().
	 * Used by child boards to determine whether to load from stored layouts or loadLayout callback.
	 */
	#hasStoredLayouts: boolean = false;

	/**
	 * Event bus for communication between controllers.
	 */
	#eventBus: FlexiEventBus;

	/**
	 * Cleanup functions for event subscriptions.
	 */
	#unsubscribers: (() => void)[] = [];

	/**
	 * MediaQuery instances for each breakpoint.
	 * Created lazily when breakpoints config changes.
	 */
	#mediaQueries: SvelteMap<string, MediaQuery> = new SvelteMap();

	/**
	 * Breakpoints sorted in descending order by min-width.
	 * Largest breakpoint first, so we match the largest applicable one.
	 */
	#sortedBreakpoints: [string, number][] = $derived.by(() => {
		const breakpoints = this.config?.breakpoints ?? {};
		return Object.entries(breakpoints)
			.filter(([key]) => key !== DEFAULT_BREAKPOINT)
			.sort((a, b) => b[1] - a[1]);
	});

	/**
	 * The currently active breakpoint key.
	 * Determined by checking MediaQuery matches in descending order.
	 * Falls back to 'default' if no breakpoint matches.
	 */
	currentBreakpoint: string = $derived.by(() => {
		// Check breakpoints in descending order (largest first)
		for (const [key] of this.#sortedBreakpoints) {
			const query = this.#mediaQueries.get(key);
			if (query?.current) {
				return key;
			}
		}
		return DEFAULT_BREAKPOINT;
	});

	/**
	 * Previous breakpoint for detecting changes.
	 */
	#previousBreakpoint: string = DEFAULT_BREAKPOINT;

	constructor(props: ResponsiveFlexiBoardProps) {
		this.#rawProps = props;
		this.#eventBus = getFlexiEventBus();

		// Subscribe to board layout changes
		this.#unsubscribers.push(
			this.#eventBus.subscribe('board:layoutchange', this.#onBoardLayoutChange.bind(this))
		);

		// Initialize media queries when breakpoints config changes
		$effect(() => {
			this.#initializeMediaQueries();
		});

		// Detect and handle breakpoint changes
		$effect(() => {
			const current = this.currentBreakpoint;
			const previous = this.#previousBreakpoint;

			if (previous !== current) {
				this.#onBreakpointChange(previous, current);
				this.#previousBreakpoint = current;
			}
		});
	}

	/**
	 * Handles layout change events from child boards.
	 */
	#onBoardLayoutChange(event: BoardLayoutChangeEvent) {
		// Only handle events from boards under our control
		if (event.board.responsiveController !== this) {
			return;
		}

		// Store the layout for this breakpoint
		if (event.breakpoint) {
			this.#storedLayouts[event.breakpoint] = event.layout;
			this.#hasStoredLayouts = true;
			this.#notifyLayoutChange();
		}
	}

	/**
	 * Creates MediaQuery instances for each configured breakpoint.
	 */
	#initializeMediaQueries() {
		const breakpoints = this.config?.breakpoints ?? {};

		// Clear existing queries
		this.#mediaQueries.clear();

		// Create min-width queries for each breakpoint (except 'default')
		for (const [key, minWidth] of Object.entries(breakpoints)) {
			if (key === DEFAULT_BREAKPOINT) {
                continue;
            }
			this.#mediaQueries.set(key, new MediaQuery(`(min-width: ${minWidth}px)`, false));
		}
	}

	/**
	 * Called when the active breakpoint changes.
	 */
	#onBreakpointChange(oldBreakpoint: string, newBreakpoint: string) {
		this.config?.onBreakpointChange?.(newBreakpoint, oldBreakpoint);
	}

	// =========================================================================
	// Layout access for the active breakpoint (used by component)
	// =========================================================================

	/**
	 * Gets the layout for the current breakpoint.
	 * Falls back to 'default' if no layout exists for the current breakpoint.
	 */
	getLayoutForCurrentBreakpoint(): FlexiLayout | undefined {
		return this.#storedLayouts[this.currentBreakpoint] ?? this.#storedLayouts[DEFAULT_BREAKPOINT];
	}

	/**
	 * Updates the layout for the current breakpoint.
	 * Called when the active FlexiBoard's layout changes.
	 */
	setLayoutForCurrentBreakpoint(layout: FlexiLayout): void {
		this.#storedLayouts[this.currentBreakpoint] = layout;
		this.#notifyLayoutChange();
	}

	/**
	 * Debounced notification of layout changes.
	 */
	#notifyLayoutChange(): void {
		if (this.#layoutChangeTimeout) {
			clearTimeout(this.#layoutChangeTimeout);
		}

		this.#layoutChangeTimeout = setTimeout(() => {
			this.#layoutChangeTimeout = null;
			this.config?.onLayoutsChange?.(this.exportLayout());
		}, this.#layoutChangeDebounceMs);
	}

	// =========================================================================
	// Per-breakpoint layout access
	// =========================================================================

	/**
	 * Gets the layout for a specific breakpoint.
	 */
	getLayoutForBreakpoint(breakpoint: string): FlexiLayout | undefined {
		return this.#storedLayouts[breakpoint];
	}

	/**
	 * Sets the layout for a specific breakpoint.
	 */
	setLayoutForBreakpoint(breakpoint: string, layout: FlexiLayout): void {
		this.#storedLayouts[breakpoint] = layout;
	}

	/**
	 * Checks if a layout exists for a specific breakpoint.
	 */
	hasLayoutForBreakpoint(breakpoint: string): boolean {
		return breakpoint in this.#storedLayouts;
	}

	// =========================================================================
	// Import/Export (ResponsiveFlexiBoardController interface)
	// =========================================================================

	/**
	 * Imports all responsive layouts.
	 * Replaces any existing stored layouts.
	 */
	importLayout(layout: ResponsiveFlexiLayout): void {
		this.#storedLayouts = { ...layout };
		this.#hasStoredLayouts = true;

		// Notify child boards to reload their layout from the stored layouts
		this.#eventBus.dispatch('responsive:layoutimport', {
			responsiveController: this
		});
	}

	/**
	 * Exports all responsive layouts.
	 * Returns a copy of the stored layouts.
	 */
	exportLayout(): ResponsiveFlexiLayout {
		return { ...this.#storedLayouts };
	}

	// =========================================================================
	// Utility getters
	// =========================================================================

	/**
	 * Returns all breakpoint keys that have stored layouts.
	 */
	get definedBreakpoints(): string[] {
		return Object.keys(this.#storedLayouts);
	}

	/**
	 * Returns all configured breakpoint keys (from config).
	 */
	get configuredBreakpoints(): string[] {
		return Object.keys(this.config?.breakpoints ?? {});
	}

	/**
	 * Returns the sorted breakpoints (largest first, excluding 'default').
	 */
	get sortedBreakpoints(): [string, number][] {
		return this.#sortedBreakpoints;
	}

	// =========================================================================
	// Lifecycle
	// =========================================================================

	/**
	 * Called when the responsive board is ready to load layouts.
	 * Triggers initial layout loading from the `loadLayouts` config.
	 */
	oninitialloadcomplete(): void {
		if (this.#ready) {
            return;
        }
		this.#ready = true;

		const loadLayoutsFn = this.config?.loadLayouts;
		if (loadLayoutsFn) {
			const layouts = loadLayoutsFn();
			if (layouts) {
				this.importLayout(layouts);
			}
		}
	}

	/**
	 * Whether the responsive board has completed initial loading.
	 */
	get ready(): boolean {
		return this.#ready;
	}

	/**
	 * Whether layouts have been imported via importLayout() or received from child boards.
	 * Child boards check this to know whether to auto-load from stored layouts
	 * or use their loadLayout callback.
	 */
	get hasStoredLayouts(): boolean {
		return this.#hasStoredLayouts;
	}

	/**
	 * Cleanup method to be called when the responsive board is destroyed.
	 */
	destroy(): void {
		this.#mediaQueries.clear();

		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];

		if (this.#layoutChangeTimeout) {
			clearTimeout(this.#layoutChangeTimeout);
			this.#layoutChangeTimeout = null;
		}
	}
}
