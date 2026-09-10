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
import { isSsrEnvironment } from '../shared/ssr.js';
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
		// No media query can match on the server — use the configured stand-in
		// so the server-rendered layout matches the most likely viewport.
		if (isSsrEnvironment()) {
			return this.config$()?.ssrBreakpoint ?? DEFAULT_BREAKPOINT;
		}

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

		// Not on the server — loadLayouts callbacks read client storage. The
		// server renders the declared layouts, flagged via layoutPending; the
		// client's init pass runs this again and imports.
		if (isSsrEnvironment()) {
			return;
		}

		const loadLayoutsFn = this.config$()?.loadLayouts;
		if (loadLayoutsFn) {
			const layouts = loadLayoutsFn();
			if (layouts) {
				this.importLayout(layouts);
			}
		}
		this.#clientLayoutsResolved$(true);
	}

	#clientLayoutsResolved$: Signal<boolean> = signal(false);

	/**
	 * Whether the layouts are provisional — `loadLayouts` is configured but
	 * hasn't run yet (always, during a server render). See
	 * InternalFlexiBoardController.layoutPending.
	 */
	get layoutPending(): boolean {
		if (this.#clientLayoutsResolved$()) {
			return false;
		}
		return !!this.config$()?.loadLayouts;
	}

	/**
	 * The breakpoint this render is assuming without confirmation, or null once
	 * it's real. Non-null only while server-rendering: the server can't match a
	 * media query, so whatever breakpoint it renders (ssrBreakpoint, else
	 * 'default') is a guess. Adapters emit it into the markup
	 * (data-flexi-pending), which lets a stylesheet make the guess
	 * honest — e.g. veil the board except under a media query matching the
	 * guessed breakpoint's own range. On the client matchMedia answers
	 * immediately, so this is null from the first client render.
	 */
	get breakpointPending(): string | null {
		if (!isSsrEnvironment()) {
			return null;
		}
		return this.ssrAssumedBreakpoint;
	}

	/**
	 * The breakpoint a server render assumes (ssrBreakpoint, else 'default') —
	 * environment-independent, unlike breakpointPending. Adapters use it to
	 * keep suspense markup identical between the server render and the
	 * client's hydration pass.
	 */
	get ssrAssumedBreakpoint(): string {
		return this.config$()?.ssrBreakpoint ?? DEFAULT_BREAKPOINT;
	}

	/**
	 * The viewport width range in which `key` is the active breakpoint:
	 * from its own threshold up to (exclusive) the next larger one. The
	 * 'default' breakpoint's range is everything below the smallest
	 * threshold. Null for unknown keys. Used to generate the media query
	 * that decides whether a served breakpoint guess matched the viewport.
	 */
	rangeForBreakpoint(key: string): { minWidth?: number; maxWidth?: number } | null {
		// Sorted descending by threshold.
		const sorted = this.#sortedBreakpoints$();

		if (key === DEFAULT_BREAKPOINT) {
			const smallest = sorted[sorted.length - 1];
			return smallest ? { maxWidth: Number(smallest[1]) } : {};
		}

		const index = sorted.findIndex(([k]) => k === key);
		if (index === -1) {
			return null;
		}

		const nextLarger = sorted[index - 1];
		return {
			minWidth: Number(sorted[index][1]),
			...(nextLarger ? { maxWidth: Number(nextLarger[1]) } : {})
		};
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
