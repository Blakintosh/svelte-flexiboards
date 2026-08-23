import type { FlexiLayout } from '../board/types.js';
import type { ResponsiveFlexiBoardController } from './base.js';
import type {
	ResponsiveFlexiBoardConfiguration,
	ResponsiveFlexiBoardProps,
	ResponsiveFlexiLayout
} from './types.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import type { InternalBoardLayoutChangeEvent } from '../internal-types.js';
import type { InternalFlexiBoardController } from '../board/controller.js';
import { computed, effect, signal, trigger, untracked } from '../reactivity.js';
import { shallowEqual } from '../shared/prop-sync.js';
import type { ReadonlySignal, Signal } from '../types.js';
import { ReactiveMap } from '../shared/reactive-collections.js';

const DEFAULT_BREAKPOINT = 'default';

/**
 * Signal-backed replacement for Svelte's MediaQuery (svelte/reactivity).
 * Wraps window.matchMedia, exposing a reactive `current` boolean.
 */
class MediaQuery {
	#matches$: Signal<boolean>;
	#mql: MediaQueryList | null = null;
	#listener: ((event: MediaQueryListEvent) => void) | null = null;

	constructor(query: string, fallback: boolean = false) {
		this.#matches$ = signal(fallback);

		if (typeof window === 'undefined') {
			return;
		}

		this.#mql = window.matchMedia(query);
		this.#matches$(this.#mql.matches);

		this.#listener = (event: MediaQueryListEvent) => {
			this.#matches$(event.matches);
		};
		this.#mql.addEventListener('change', this.#listener);
	}

	get current(): boolean {
		return this.#matches$();
	}

	destroy() {
		if (this.#mql && this.#listener) {
			this.#mql.removeEventListener('change', this.#listener);
		}
		this.#mql = null;
		this.#listener = null;
	}
}

export class InternalResponsiveFlexiBoardController implements ResponsiveFlexiBoardController {
	#rawProps$: Signal<ResponsiveFlexiBoardProps | undefined> = signal(undefined);
	config$: ReadonlySignal<ResponsiveFlexiBoardConfiguration | undefined> = computed(
		() => this.#rawProps$()?.config
	);

	/**
	 * Stored layouts for all breakpoints.
	 * This is the source of truth - active board syncs to/from this.
	 */
	#storedLayouts$: Signal<ResponsiveFlexiLayout> = signal({});

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
	 * Stop functions for effects created by this controller.
	 */
	#stopEffects: (() => void)[] = [];

	/**
	 * MediaQuery instances for each breakpoint.
	 * Created lazily when breakpoints config changes.
	 */
	#mediaQueries: ReactiveMap<string, MediaQuery> = new ReactiveMap();

	/**
	 * Breakpoints sorted in descending order by min-width.
	 * Largest breakpoint first, so we match the largest applicable one.
	 */
	#sortedBreakpoints$: ReadonlySignal<[string, number][]> = computed(() => {
		const breakpoints = this.config$()?.breakpoints ?? {};
		return Object.entries(breakpoints)
			.filter(([key]) => key !== DEFAULT_BREAKPOINT)
			.sort((a, b) => b[1] - a[1]);
	});

	/**
	 * The currently active breakpoint key.
	 * Determined by checking MediaQuery matches in descending order.
	 * Falls back to 'default' if no breakpoint matches.
	 */
	#currentBreakpoint$: ReadonlySignal<string> = computed(() => {
		// Check breakpoints in descending order (largest first)
		for (const [key] of this.#sortedBreakpoints$()) {
			const query = this.#mediaQueries.get(key);
			if (query?.current) {
				return key;
			}
		}
		return DEFAULT_BREAKPOINT;
	});

	get currentBreakpoint(): string {
		return this.#currentBreakpoint$();
	}

	/**
	 * Previous breakpoint for detecting changes.
	 */
	#previousBreakpoint: string = DEFAULT_BREAKPOINT;

	constructor(props: ResponsiveFlexiBoardProps) {
		// Normalised through the seam so identity never matches the caller's object
		// — see InternalFlexiBoardController's constructor.
		this.updateProps(props);
		this.#eventBus = getFlexiEventBus();

		// Subscribe to board layout changes
		this.#unsubscribers.push(
			this.#eventBus.subscribe('board:layoutchange', this.#onBoardLayoutChange.bind(this))
		);

		// Initialize media queries when breakpoints config changes
		this.#stopEffects.push(
			effect(() => {
				this.#initializeMediaQueries();
			})
		);

		// Detect and handle breakpoint changes
		this.#stopEffects.push(
			effect(() => {
				const current = this.currentBreakpoint;
				const previous = this.#previousBreakpoint;

				if (previous !== current) {
					this.#onBreakpointChange(previous, current);
					this.#previousBreakpoint = current;
				}
			})
		);
	}

	/**
	 * Updates the props backing this controller's reactive configuration.
	 * The adapter's prop seam: call whenever the component's props change.
	 */
	updateProps(props: ResponsiveFlexiBoardProps): void {
		// Inert when unchanged — see InternalFlexiBoardController.updateProps for
		// why this guard is load-bearing rather than an optimisation.
		const previous = untracked(() => this.#rawProps$());

		if (previous && shallowEqual(previous.config, props.config, 1)) {
			return;
		}

		this.#rawProps$({ ...props, config: props.config ? { ...props.config } : props.config });
	}

	/**
	 * Handles layout change events from child boards.
	 */
	#onBoardLayoutChange(event: InternalBoardLayoutChangeEvent) {
		// Only handle events from boards under our control
		if (event.board.responsiveController !== this) {
			return;
		}

		// Store the layout for this breakpoint
		if (event.breakpoint) {
			this.#storedLayouts$()[event.breakpoint] = event.layout;
			trigger(() => this.#storedLayouts$());
			this.#hasStoredLayouts = true;
			this.#notifyLayoutChange();
		}
	}

	/**
	 * Creates MediaQuery instances for each configured breakpoint.
	 */
	#initializeMediaQueries() {
		const breakpoints = this.config$()?.breakpoints ?? {};

		// Clear existing queries
		this.#mediaQueries.forEach((query) => query.destroy());
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
		this.config$()?.onBreakpointChange?.(newBreakpoint, oldBreakpoint);
	}

	// =========================================================================
	// Layout access for the active breakpoint (used by component)
	// =========================================================================

	/**
	 * Gets the layout for the current breakpoint.
	 * Falls back to 'default' if no layout exists for the current breakpoint.
	 */
	getLayoutForCurrentBreakpoint(): FlexiLayout | undefined {
		const storedLayouts = this.#storedLayouts$();
		return storedLayouts[this.currentBreakpoint] ?? storedLayouts[DEFAULT_BREAKPOINT];
	}

	/**
	 * Updates the layout for the current breakpoint.
	 * Called when the active FlexiBoard's layout changes.
	 */
	setLayoutForCurrentBreakpoint(layout: FlexiLayout): void {
		this.#storedLayouts$()[this.currentBreakpoint] = layout;
		trigger(() => this.#storedLayouts$());
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
			this.config$()?.onLayoutsChange?.(this.exportLayout());
		}, this.#layoutChangeDebounceMs);
	}

	// =========================================================================
	// Per-breakpoint layout access
	// =========================================================================

	/**
	 * Gets the layout for a specific breakpoint.
	 */
	getLayoutForBreakpoint(breakpoint: string): FlexiLayout | undefined {
		return this.#storedLayouts$()[breakpoint];
	}

	/**
	 * Sets the layout for a specific breakpoint.
	 */
	setLayoutForBreakpoint(breakpoint: string, layout: FlexiLayout): void {
		this.#storedLayouts$()[breakpoint] = layout;
		trigger(() => this.#storedLayouts$());
	}

	/**
	 * Checks if a layout exists for a specific breakpoint.
	 */
	hasLayoutForBreakpoint(breakpoint: string): boolean {
		return breakpoint in this.#storedLayouts$();
	}

	// =========================================================================
	// Import/Export (ResponsiveFlexiBoardController interface)
	// =========================================================================

	/**
	 * Imports all responsive layouts.
	 * Replaces any existing stored layouts.
	 */
	importLayout(layout: ResponsiveFlexiLayout): void {
		this.#storedLayouts$({ ...layout });
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
		return { ...this.#storedLayouts$() };
	}

	// =========================================================================
	// Utility getters
	// =========================================================================

	/**
	 * Returns all breakpoint keys that have stored layouts.
	 */
	get definedBreakpoints(): string[] {
		return Object.keys(this.#storedLayouts$());
	}

	/**
	 * Returns all configured breakpoint keys (from config).
	 */
	get configuredBreakpoints(): string[] {
		return Object.keys(this.config$()?.breakpoints ?? {});
	}

	/**
	 * Returns the sorted breakpoints (largest first, excluding 'default').
	 */
	get sortedBreakpoints(): [string, number][] {
		return this.#sortedBreakpoints$();
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

		const loadLayoutsFn = this.config$()?.loadLayouts;
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
		// Stop effects before tearing down the media queries they track
		this.#stopEffects.forEach((stop) => stop());
		this.#stopEffects = [];

		this.#mediaQueries.forEach((query) => query.destroy());
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
