import { isLayoutEnvelope, LAYOUT_FORMAT_VERSION, type FlexiLayoutEnvelope } from './types.js';
import type { AriaPoliteness, FlexiAnnouncerController } from '../announcer.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import { isSsrEnvironment } from '../shared/ssr.js';
import type { FlexiPortalController } from '../portal.js';
import { AutoScrollService, getPointerService, type PointerService } from '../shared/utils.js';
import { InternalFlexiTargetController } from '../target/controller.js';
import type { FlexiTargetPartialConfiguration } from '../target/types.js';
import type {
	InternalResponsiveLayoutImportEvent,
	InternalTargetEvent,
	InternalWidgetAction,
	InternalWidgetEvent,
	InternalWidgetGrabAction,
	InternalWidgetGrabbedEvent,
	InternalWidgetResizeAction,
	InternalWidgetResizingEvent
} from '../internal-types.js';
import type { FlexiBoardController } from './base.js';
import type {
	FlexiBoardConfiguration,
	FlexiBoardProps,
	FlexiRegistryEntry,
	FlexiLayout,
	FlexiWidgetLayoutEntry
} from './types.js';
import type { InternalFlexiWidgetController } from '../widget/controller.js';
import type { InternalResponsiveFlexiBoardController } from '../responsive/controller.js';
import { computed, signal, untracked, effect } from '../reactivity.js';
import { shallowEqual } from '../shared/prop-sync.js';
import type { Signal, ReadonlySignal } from '../types.js';

export class InternalFlexiBoardController implements FlexiBoardController {
	#currentWidgetAction$: Signal<InternalWidgetAction | null> = signal(null);
	#activeInterpolations$: Signal<number> = signal(0);
	#scrollbarCompensation$: Signal<number> = signal(0);
	#hasScrollbarCompensation$: Signal<boolean> = signal(false);

	#targets: Map<string, InternalFlexiTargetController> = new Map();
	hoveredTarget: InternalFlexiTargetController | null = null;

	#hoveredOverDeleter$: Signal<boolean> = signal(false);

	#ref$: Signal<HTMLElement | undefined> = signal(undefined);

	#pointerService: PointerService = getPointerService();
	#autoScrollService: AutoScrollService = new AutoScrollService(
		this.#ref$,
		() => this.config$()?.autoScroll ?? true
	);

	#rawProps$: Signal<FlexiBoardProps | undefined> = signal(undefined);
	config$: ReadonlySignal<FlexiBoardConfiguration | undefined> = computed(
		() => this.#rawProps$()?.config
	);

	/** Whether drop flights should be hosted in the viewport portal (see FlexiBoardConfiguration.portalDropFlights). */
	get portalDropFlights(): boolean {
		return this.config$()?.portalDropFlights ?? false;
	}

	registry$: ReadonlySignal<Record<string, FlexiRegistryEntry> | undefined> = computed(
		() => this.#rawProps$()?.config?.registry
	);

	#nextTargetIndex = 0;

	#ready: boolean = false;
	#storedLoadLayout?: FlexiLayout;

	portal: FlexiPortalController | null = null;

	#announcer: FlexiAnnouncerController | null = null;

	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];

	#layoutChangePending = false;

	readonly breakpoint?: string;

	/**
	 * The parent responsive controller, if this board is under a ResponsiveFlexiBoard.
	 */
	#responsiveController: InternalResponsiveFlexiBoardController | null = null;

	constructor(
		props: FlexiBoardProps,
		responsiveController: InternalResponsiveFlexiBoardController | null = null
	) {
		// Normalised through the same seam the adapter uses, so the stored config
		// never shares identity with the caller's object. That forces the adapter's
		// first comparison to read config key-by-key, which is what registers the
		// fine-grained dependencies it needs to notice later mutations.
		this.updateProps(props);
		this.#eventBus = getFlexiEventBus();

		if (responsiveController) {
			this.#responsiveController = responsiveController;
			this.breakpoint = this.#responsiveController.currentBreakpoint;
		} else {
			// Outside a responsive context, fall back to the config breakpoint, with a warning.
			this.breakpoint = this.#rawProps$()?.config?.breakpoint;
			if (this.breakpoint) {
				console.warn('Breakpoint is set for a non-responsive board. Ignoring breakpoint.');
			}
		}

		this.#unsubscribers.push(
			this.#eventBus.subscribe('widget:grabbed', this.onWidgetGrabbed.bind(this)),
			this.#eventBus.subscribe('widget:resizing', this.onWidgetResizing.bind(this)),
			this.#eventBus.subscribe('widget:release', this.handleWidgetRelease.bind(this)),
			this.#eventBus.subscribe('widget:cancel', this.handleWidgetCancel.bind(this)),

			this.#eventBus.subscribe('target:pointerenter', this.onPointerEnterTarget.bind(this)),
			this.#eventBus.subscribe('target:pointerleave', this.onPointerLeaveTarget.bind(this)),

			// Layout change events
			this.#eventBus.subscribe('widget:dropped', this.#onLayoutChange.bind(this)),
			this.#eventBus.subscribe('widget:delete', this.#onLayoutChange.bind(this)),
			this.#eventBus.subscribe('layout:changed', this.#onLayoutChange.bind(this)),

			// Consumer callbacks. Subscribed last among the board's own handlers,
			// so they observe the committed state.
			this.#eventBus.subscribe('widget:grabbed', (event) => {
				if (event.board === this) {
					this.config$()?.onWidgetGrab?.({ widget: event.widget, target: event.target });
				}
			}),
			this.#eventBus.subscribe('widget:dropped', (event) => {
				if (event.board !== this || !event.newTarget) return;
				if (event.action === 'resize') {
					this.config$()?.onWidgetResize?.({ widget: event.widget, target: event.newTarget });
					return;
				}
				this.config$()?.onWidgetDrop?.({
					widget: event.widget,
					sourceTarget: event.oldTarget,
					target: event.newTarget
				});
			}),
			this.#eventBus.subscribe('widget:entertarget', (event) => {
				if (event.board === this) {
					this.config$()?.onWidgetEnterTarget?.({ widget: event.widget, target: event.target });
				}
			}),
			this.#eventBus.subscribe('widget:leavetarget', (event) => {
				if (event.board === this) {
					this.config$()?.onWidgetLeaveTarget?.({ widget: event.widget, target: event.target });
				}
			}),
			this.#eventBus.subscribe('widget:cancel', (event) => {
				if (event.board === this) {
					this.config$()?.onWidgetCancel?.({ widget: event.widget, target: event.target });
				}
			}),
			this.#eventBus.subscribe('widget:delete', (event) => {
				if (event.board === this) {
					this.config$()?.onWidgetDelete?.({ widget: event.widget, target: event.target });
				}
			}),

			// Responsive layout import events
			this.#eventBus.subscribe('responsive:layoutimport', this.#onResponsiveLayoutImport.bind(this))
		);
	}

	#onLayoutChange(event: { board: InternalFlexiBoardController }) {
		// Not our event
		if (event.board !== this) {
			return;
		}

		// No point exporting if nobody is listening
		if (!this.config$()?.onLayoutChange && !this.#responsiveController) {
			return;
		}

		if (this.#layoutChangePending) return;
		this.#layoutChangePending = true;
		// Let source and destination handlers finish, then report the committed layout before paint.
		queueMicrotask(() => {
			if (!this.#layoutChangePending) return;
			this.#layoutChangePending = false;

			const layout = this.#exportLayoutInternal();

			// For the responsive controller and any other listeners.
			this.#eventBus.dispatch('board:layoutchange', {
				board: this,
				layout,
				breakpoint: this.breakpoint
			});

			this.config$()?.onLayoutChange?.(layout);
		});
	}

	#onResponsiveLayoutImport(event: InternalResponsiveLayoutImportEvent) {
		// Not our responsive controller
		if (event.responsiveController !== this.#responsiveController) {
			return;
		}

		if (this.breakpoint) {
			const layout = this.#responsiveController?.getLayoutForBreakpoint(this.breakpoint);
			if (layout) {
				this.#importLayoutInternal(layout);
			}
		}
	}

	style$: ReadonlySignal<string> = computed(() => {
		const currentWidgetAction = this.#currentWidgetAction$();
		const needsOverflowLock = this.#activeInterpolations$() > 0 || currentWidgetAction;
		const scrollbarCompensation = this.#scrollbarCompensation$();
		const scrollbarPadding =
			this.#scrollbarCompensation$() > 0
				? ` padding-right: ${this.#scrollbarCompensation$()}px;`
				: '';
		const overflow = needsOverflowLock ? ` overflow: hidden;${scrollbarPadding}` : '';

		if (!currentWidgetAction) {
			return `position: relative;${overflow}`;
		}

		return `position: relative;${overflow} ${this.#getStyleForCurrentWidgetAction()}`;
	});

	get style() {
		return this.style$();
	}

	#getStyleForCurrentWidgetAction() {
		const currentWidgetAction = this.#currentWidgetAction$();
		if (!currentWidgetAction) {
			return '';
		}

		const cursor = this.#actionCursor();
		return cursor ? `cursor: ${cursor};` : '';
	}

	/** The cursor for the action in flight, if any: reflects a rejected drop. */
	#actionCursor(): string | null {
		const currentWidgetAction = this.#currentWidgetAction$();
		if (!currentWidgetAction) {
			return null;
		}
		if (currentWidgetAction.widget.dropRejected) {
			return 'not-allowed';
		}
		switch (currentWidgetAction.action) {
			case 'grab':
				return 'grabbing';
			case 'resize':
				return 'nwse-resize';
		}
	}

	notifyInterpolationStarted() {
		this.#captureScrollbarWidthIfNeeded();
		const activeInterpolations = this.#activeInterpolations$();
		this.#activeInterpolations$(activeInterpolations + 1);
	}

	notifyInterpolationEnded() {
		const activeInterpolations = this.#activeInterpolations$();
		this.#activeInterpolations$(Math.max(0, activeInterpolations - 1));
		this.#scheduleScrollbarCompensationRelease();
	}

	#captureScrollbarWidthIfNeeded() {
		if (this.#hasScrollbarCompensation$()) {
			return;
		}
		if (this.ref) {
			const scrollbarWidth = this.ref.offsetWidth - this.ref.clientWidth;
			const style = getComputedStyle(this.ref);
			// With `scrollbar-gutter: stable` the gutter survives `overflow: hidden`, so there is
			// nothing to compensate for. Padding as well would shift the content twice.
			const gutterIsStable = style.scrollbarGutter?.includes('stable') ?? false;
			if (scrollbarWidth > 0 && !gutterIsStable) {
				const existingPadding = parseFloat(style.paddingRight) || 0;
				this.#scrollbarCompensation$(existingPadding + scrollbarWidth);
			}
			this.#hasScrollbarCompensation$(true);
		}
	}

	#scheduleScrollbarCompensationRelease() {
		queueMicrotask(() => {
			if (this.#activeInterpolations$() === 0 && !this.#currentWidgetAction$()) {
				this.#scrollbarCompensation$(0);
				this.#hasScrollbarCompensation$(false);
			}
		});
	}

	get ref() {
		return this.#ref$();
	}

	set ref(ref: HTMLElement | undefined) {
		this.#ref$(ref);
	}

	createTarget(config?: FlexiTargetPartialConfiguration, key?: string) {
		key ??= this.#nextTargetKey();

		if (this.#targets.has(key)) {
			const existing = this.#targets.get(key)!;
			// A repeat claim during SSR is Svelte's bind: settle loop rendering
			// the target's component again. Only that new render's payload is
			// kept, so the target must shed the first pass's widgets or every
			// one of them would be server-rendered twice.
			if (isSsrEnvironment()) {
				existing.resetForRepeatedServerRender();
			}
			return existing;
		}

		const target = new InternalFlexiTargetController(this, key, config);
		this.#targets.set(key, target);
		return target;
	}

	onPointerEnterTarget(event: InternalTargetEvent) {
		if (event.board != this) {
			return;
		}

		this.hoveredTarget = event.target;

		// If a widget is being grabbed, propagate an entertarget event to this target.
		const currentAction = this.#currentWidgetAction$();
		if (currentAction?.action === 'grab') {
			this.#eventBus.dispatch('widget:entertarget', {
				board: this,
				target: event.target,
				widget: currentAction.widget
			});
		}
	}

	onPointerLeaveTarget(event: InternalTargetEvent) {
		if (event.board != this) {
			return;
		}

		// Failsafe in case another target is already registered as hovered.
		if (this.hoveredTarget === event.target) {
			this.hoveredTarget = null;
		}

		// If a widget is being grabbed, propagate a leavetarget event to this target.
		const currentAction = this.#currentWidgetAction$();
		if (currentAction?.action === 'grab') {
			this.#eventBus.dispatch('widget:leavetarget', {
				board: this,
				target: event.target,
				widget: currentAction.widget
			});
		}

		// For a resize, the pointer leaving the target doesn't matter.
	}

	onenterdeleter() {
		this.#hoveredOverDeleter$(true);
	}

	onleavedeleter() {
		this.#hoveredOverDeleter$(false);
	}

	onWidgetGrabbed(event: InternalWidgetGrabbedEvent) {
		if (this.#currentWidgetAction$() || event.board !== this) {
			return;
		}

		this.#captureScrollbarWidthIfNeeded();

		// Move the pointer to the grab point before the action exists. The move
		// dispatches synchronously, and a target the pointer thereby enters must
		// NOT get a widget:entertarget yet: the widget's own target hasn't run its
		// grab handling (removing the widget from its grid) and would snapshot
		// the grid with the widget still in it, to restore later as a phantom.
		if (event.clientX !== undefined && event.clientY !== undefined) {
			this.#pointerService.updatePosition(event.clientX, event.clientY);
		}

		const action: InternalWidgetGrabAction = {
			action: 'grab',
			widget: event.widget,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			capturedHeightPx: event.capturedHeightPx,
			capturedWidthPx: event.capturedWidthPx
		};
		this.#currentWidgetAction$(action);

		// A target the pointer already rests in saw no entertarget (there was no
		// action then). The widget's own target handles the grab itself; a foreign
		// one (a keyboard grab jumping the pointer from wherever the mouse rested,
		// or an adder whose button sits over a board) must be told, or it never
		// shows the drop preview and refuses the release.
		const hovered = this.hoveredTarget;
		if (hovered && hovered !== event.widget.internalTarget) {
			this.#eventBus.dispatch('widget:entertarget', {
				board: this,
				target: hovered,
				widget: event.widget
			});
		}

		this.#lockViewport();

		this.announce(`You have grabbed the widget at x: ${event.widget.x}, y: ${event.widget.y}.`);
	}

	onWidgetResizing(event: InternalWidgetResizingEvent) {
		if (this.#currentWidgetAction$() || event.board !== this) {
			return;
		}

		this.#captureScrollbarWidthIfNeeded();

		this.#currentWidgetAction$({
			action: 'resize',
			widget: event.widget,
			offsetX: event.offsetX,
			offsetY: event.offsetY,
			left: event.left,
			top: event.top,
			capturedHeightPx: event.capturedHeightPx,
			capturedWidthPx: event.capturedWidthPx,
			initialHeightUnits: event.widget.height,
			initialWidthUnits: event.widget.width
		});

		this.#lockViewport();
		this.announce(`You are resizing the widget at x: ${event.widget.x}, y: ${event.widget.y}.`);
	}

	#originalOverscrollBehaviorY: string | null = null;
	#originalTouchAction: string | null = null;
	#originalUserSelect: string | null = null;
	#cursorStyle: HTMLStyleElement | null = null;
	#stopCursorEffect: (() => void) | null = null;

	#lockViewport() {
		this.#originalOverscrollBehaviorY = document.documentElement.style.overscrollBehaviorY;
		this.#originalTouchAction = document.documentElement.style.touchAction;
		this.#originalUserSelect = document.documentElement.style.userSelect;

		document.documentElement.style.overscrollBehaviorY = 'contain';
		document.documentElement.style.touchAction = 'none';
		document.documentElement.style.userSelect = 'none';

		// The cursor is decided by whatever is under the pointer, which is rarely the board or
		// the clone (it ignores pointer events), so the action's cursor is applied globally.
		this.#cursorStyle = document.createElement('style');
		document.head.appendChild(this.#cursorStyle);
		this.#stopCursorEffect = effect(() => {
			const cursor = this.#actionCursor();
			this.#cursorStyle!.textContent = cursor ? `* { cursor: ${cursor} !important; }` : '';
		});
	}

	#unlockViewport() {
		document.documentElement.style.overscrollBehaviorY =
			this.#originalOverscrollBehaviorY ?? 'auto';
		document.documentElement.style.touchAction = this.#originalTouchAction ?? 'auto';
		document.documentElement.style.userSelect = this.#originalUserSelect ?? 'auto';

		this.#stopCursorEffect?.();
		this.#stopCursorEffect = null;
		this.#cursorStyle?.remove();
		this.#cursorStyle = null;
	}

	handleWidgetRelease(event: InternalWidgetEvent) {
		// Not our event.
		if (event.board !== this) {
			return;
		}

		this.#unlockViewport();

		const currentAction = this.#currentWidgetAction$()!;
		// First handler to run: the portal clone is still on screen, so this is the moment to
		// remember where the widget is before anything tears it down.
		currentAction.widget.captureReleaseState();
		// Captured before any handler can change widget.internalTarget.
		const sourceTarget = currentAction.widget.internalTarget;

		switch (currentAction.action) {
			case 'grab':
				this.#handleGrabbedWidgetRelease(currentAction);
				break;
			case 'resize':
				this.#handleResizingWidgetRelease(currentAction);
				break;
		}

		// Restore an unhandled drop after synchronous handlers finish. A release
		// outside all targets leaves the source's pre-grab snapshot intact.
		queueMicrotask(() => {
			if (sourceTarget?.hasPreGrabSnapshot()) {
				sourceTarget.restorePreGrabSnapshot();
				sourceTarget.applyGridPostCompletionOperations();
			}
		});
	}

	handleWidgetCancel(event: InternalWidgetEvent) {
		// Not our event.
		if (event.board !== this) {
			return;
		}

		this.#unlockViewport();

		// Captured before the action is released.
		const sourceTarget = this.#currentWidgetAction$()?.widget.internalTarget;
		this.#currentWidgetAction$()?.widget.captureReleaseState();

		this.#releaseCurrentWidgetAction();

		// Safety net for a cancel outside all targets: if the source target still has
		// a pre-grab snapshot after all handlers run, restore it.
		queueMicrotask(() => {
			if (sourceTarget?.hasPreGrabSnapshot()) {
				sourceTarget.restorePreGrabSnapshot();
				sourceTarget.applyGridPostCompletionOperations();
			}
		});
	}

	attachAnnouncer(announcer: FlexiAnnouncerController) {
		this.#announcer = announcer;
	}

	announce(message: string, politeness: AriaPoliteness = 'polite') {
		if (this.#announcer) {
			this.#announcer.announce(message, politeness);
		}
	}

	#clientLayoutResolved$: Signal<boolean> = signal(false);

	/**
	 * Whether this board's layout is provisional: a `loadLayout` (or, under a
	 * ResponsiveFlexiBoard, `loadLayouts`) is configured but hasn't run yet.
	 * True throughout SSR and until the initial client load resolves. The server
	 * uses the declared layout because loaders may read client storage. Adapters
	 * expose this flag in markup so consumers can style the provisional layout.
	 */
	get layoutPending(): boolean {
		if (this.#responsiveController) {
			return this.#responsiveController.layoutPending;
		}
		if (this.#clientLayoutResolved$()) {
			return false;
		}
		return !!this.config$()?.loadLayout;
	}

	/**
	 * The breakpoint this render is assuming without confirmation, or null.
	 * Set under a ResponsiveFlexiBoard during SSR and any deferred hydration.
	 * See InternalResponsiveFlexiBoardController.breakpointPending.
	 */
	get breakpointPending(): string | null {
		return this.#responsiveController?.breakpointPending ?? null;
	}

	/**
	 * The breakpoint a server render of this board assumes, or null when not
	 * under a ResponsiveFlexiBoard. Environment-independent, see
	 * InternalResponsiveFlexiBoardController.ssrAssumedBreakpoint.
	 */
	get ssrAssumedBreakpoint(): string | null {
		return this.#responsiveController?.ssrAssumedBreakpoint ?? null;
	}

	/**
	 * The viewport range in which `key` is the active breakpoint, for
	 * suspense media query generation. Null outside a responsive context.
	 */
	breakpointRange(key: string): { minWidth?: number; maxWidth?: number } | null {
		return this.#responsiveController?.rangeForBreakpoint(key) ?? null;
	}

	/**
	 * The configured initial layout entries for a target, if any. Consulted by
	 * targets during initial widget creation, within the render pass, so it
	 * holds on the server too. Under a ResponsiveFlexiBoard, the parent's
	 * `initialLayouts` for this board's breakpoint takes precedence.
	 */
	initialLayoutFor(targetKey: string): FlexiWidgetLayoutEntry[] | undefined {
		if (this.#responsiveController && this.breakpoint) {
			const fromParent =
				this.#responsiveController.config$()?.initialLayouts?.[this.breakpoint]?.[targetKey];
			if (fromParent) {
				return fromParent;
			}
		}
		return this.config$()?.initialLayout?.[targetKey];
	}

	oninitialloadcomplete() {
		if (this.#ready) return;
		this.#ready = true;

		if (this.#storedLoadLayout) {
			this.#importLayoutInternal(this.#storedLoadLayout);
			this.#storedLoadLayout = undefined;
			this.#clientLayoutResolved$(true);
			return;
		}

		if (this.#responsiveController && this.breakpoint) {
			const layout = this.#responsiveController.getLayoutForBreakpoint(this.breakpoint);
			if (layout) {
				this.#importLayoutInternal(layout);
				return;
			}
			// Fall through to loadLayout callback if no stored layout for this breakpoint
		}

		// Check for loadLayout in config (for non-responsive boards OR first-time breakpoint).
		// Not on the server: loadLayout callbacks typically read client storage
		// (localStorage etc.), which doesn't exist there. The server renders the
		// declared layout, flagged via layoutPending, and the client's own
		// init pass re-runs this and imports.
		if (isSsrEnvironment()) {
			return;
		}
		const loadLayoutFn = this.config$()?.loadLayout;
		if (loadLayoutFn) {
			const layout = loadLayoutFn();
			if (layout) {
				this.#importLayoutInternal(this.#normalizeLayout(layout));
			}
		}
		// Resolved even when nothing was stored: the declared layout is now final.
		this.#clientLayoutResolved$(true);
	}

	/**
	 * Imports a layout into this board.
	 *
	 * **Note**: If this board is under a ResponsiveFlexiBoard, prefer using
	 * `responsiveBoard.importLayout()` to import layouts for all breakpoints.
	 */
	importLayout(layout: FlexiLayout | FlexiLayoutEnvelope) {
		if (this.#responsiveController) {
			console.warn(
				'importLayout() called directly on a FlexiBoard under ResponsiveFlexiBoard. ' +
					'Use responsiveBoard.importLayout() instead to import layouts for all breakpoints.'
			);
		}
		this.#importLayoutInternal(this.#normalizeLayout(layout));
	}

	/**
	 * importLayout without the warning, used by the responsive controller.
	 */
	#importLayoutInternal(layout: FlexiLayout) {
		// Not ready to import yet, store the layout for later.
		if (!this.#ready) {
			this.#storedLoadLayout = layout;
			return;
		}

		this.#targets.forEach((target) => {
			const targetLayout = layout[target.key];
			if (targetLayout) {
				target.importLayout(targetLayout);
			}
		});
	}

	#normalizeLayout(
		layout: FlexiLayout | FlexiLayoutEnvelope | FlexiWidgetLayoutEntry[]
	): FlexiLayout {
		// A persisted envelope: today there is one format version, so it unwraps;
		// this is where a later version would migrate.
		if (isLayoutEnvelope(layout)) {
			return layout.layout;
		}
		// An array targets the first target only.
		if (Array.isArray(layout)) {
			const firstTargetKey = this.#targets.keys().next().value;
			if (firstTargetKey) {
				return { [firstTargetKey]: layout };
			}
			return {};
		}
		return layout;
	}

	/**
	 * Exports the current layout from this board.
	 *
	 * **Note**: If this board is under a ResponsiveFlexiBoard, prefer using
	 * `responsiveBoard.exportLayout()` to export layouts for all breakpoints.
	 */
	exportLayout(): FlexiLayout {
		if (this.#responsiveController) {
			console.warn(
				'exportLayout() called directly on a FlexiBoard under ResponsiveFlexiBoard. ' +
					'Use responsiveBoard.exportLayout() instead to export layouts for all breakpoints.'
			);
		}
		return this.#exportLayoutInternal();
	}

	/**
	 * exportLayout without the warning, used internally.
	 */
	#exportLayoutInternal(): FlexiLayout {
		const result: FlexiLayout = {};

		this.#targets.forEach((target) => {
			result[target.key] = target.exportLayout();
		});

		return result;
	}

	#handleGrabbedWidgetRelease(action: InternalWidgetGrabAction) {
		if (this.#hoveredOverDeleter$()) {
			this.#eventBus.dispatch('widget:delete', {
				board: this,
				widget: action.widget,
				target: action.widget.internalTarget
			});
			this.#releaseCurrentWidgetAction();
			return;
		}

		this.#releaseCurrentWidgetAction();
	}

	#handleResizingWidgetRelease(action: InternalWidgetResizeAction) {
		this.#releaseCurrentWidgetAction();
	}

	#releaseCurrentWidgetAction() {
		const currentWidgetAction = this.#currentWidgetAction$();

		if (!currentWidgetAction) {
			return;
		}

		this.announce(`You have released the widget.`);
		this.#currentWidgetAction$(null);
		this.#scheduleScrollbarCompensationRelease();
	}

	/**
	 * Whether the consumer's `canDrop` (if any) allows this placement. The grid's
	 * own rules are checked separately by the caller.
	 */
	canDrop(
		widget: InternalFlexiWidgetController,
		target: InternalFlexiTargetController,
		box: { x: number; y: number; width: number; height: number }
	): boolean {
		const check = untracked(() => this.config$()?.canDrop);
		return check ? check({ widget, target, ...box }) : true;
	}

	/**
	 * Places a widget at a position in a target through the controller API
	 * (no user interaction): the mechanism behind `widget.moveTo()`.
	 * @returns Whether the widget could be placed. On failure it stays put.
	 */
	placeWidget(
		widget: InternalFlexiWidgetController,
		to: InternalFlexiTargetController,
		x?: number,
		y?: number
	): boolean {
		const from = widget.internalTarget;
		const previous = { x: widget.x, y: widget.y, width: widget.width, height: widget.height };

		if (from) {
			from.detachWidget(widget);
		}

		if (to.attachWidget(widget, x, y)) {
			this.#eventBus.dispatch('layout:changed', { board: this });
			return true;
		}

		// Put it back exactly where it was.
		from?.attachWidget(widget, previous.x, previous.y, previous.width, previous.height);
		return false;
	}

	clear(): void {
		this.#targets.forEach((target) => target.clear());
	}

	exportLayoutEnvelope(): FlexiLayoutEnvelope {
		return { version: LAYOUT_FORMAT_VERSION, layout: this.exportLayout() };
	}

	moveWidget(
		widget: InternalFlexiWidgetController,
		from: InternalFlexiTargetController | undefined,
		to: InternalFlexiTargetController
	): boolean {
		const dropSuccessful = to.tryDropWidget(widget);

		// A new widget has no from target.
		if (from) {
			from.widgets.delete(widget);
			from.forgetPreGrabSnapshot();

			// Deferred source-target operations, e.g. collapsing empty rows.
			if (dropSuccessful) {
				from.applyGridPostCompletionOperations();
			}
		}

		widget.target = to;
		to.widgets.add(widget);
		return true;
	}

	#nextTargetKey() {
		return `target-${this.#nextTargetIndex++}`;
	}

	get currentWidgetAction() {
		return this.#currentWidgetAction$();
	}

	/**
	 * Updates the props backing this controller's reactive configuration.
	 * The adapter's prop seam: call whenever the component's props change.
	 */
	updateProps(props: FlexiBoardProps): void {
		// Adapters call this from inside their own effect, so it must be inert
		// when nothing changed. An unconditional write can be re-entered by the
		// invalidation it causes and spin forever.
		//
		// `config` is the only thing read off these props, so identity churn in
		// sibling props (snippets, class) must never invalidate anything.
		const previous = untracked(() => this.#rawProps$());

		if (previous && shallowEqual(previous.config, props.config, 1)) {
			return;
		}

		// Stored as a fresh object at both levels: the signal and the `config$`
		// computed both dedupe on identity, so a mutated-in-place config would
		// otherwise be swallowed and never reach targets or widgets.
		this.#rawProps$({ ...props, config: props.config ? { ...props.config } : props.config });
	}

	/**
	 * The parent responsive controller, if this board is under one.
	 */
	get responsiveController() {
		return this.#responsiveController;
	}

	/**
	 * Called when the board is destroyed.
	 */
	destroy() {
		// A route change can unmount a board before pointerup/Escape arrives.
		// Restore only a lock owned by this board; idle boards must not undo
		// another board's active interaction.
		if (this.#cursorStyle) this.#unlockViewport();
		const widget = this.#currentWidgetAction$()?.widget;
		if (widget) {
			this.#pointerService.disableKeyboardControls();
			this.portal?.returnWidgetFromPortal(widget);
		}
		this.#currentWidgetAction$(null);
		this.#announcer?.destroy();

		this.#targets.forEach((target) => target.destroy());
		this.#targets.clear();

		this.#autoScrollService.destroy();

		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];

		this.#layoutChangePending = false;
	}
}
