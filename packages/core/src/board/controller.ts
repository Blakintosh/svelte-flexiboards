import type { AriaPoliteness, FlexiAnnouncerController } from '../announcer.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
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
	#autoScrollService: AutoScrollService = new AutoScrollService(this.#ref$);

	#rawProps$: Signal<FlexiBoardProps | undefined> = signal(undefined);
	config$: ReadonlySignal<FlexiBoardConfiguration | undefined> = computed(
		() => this.#rawProps$()?.config
	);

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

	#layoutChangeTimeout: ReturnType<typeof setTimeout> | null = null;
	#layoutChangeDebounceMs = 150;

	readonly breakpoint?: string;

	/**
	 * Reference to the parent responsive controller, if this board is within a ResponsiveFlexiBoard.
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

		// Check if we're inside a responsive context
		if (responsiveController) {
			this.#responsiveController = responsiveController;
			// Infer breakpoint from responsive controller's current state
			this.breakpoint = this.#responsiveController.currentBreakpoint;
		} else {
			// Not in responsive context - use config breakpoint if provided (with warning)
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

		// Debounce the callback
		if (this.#layoutChangeTimeout) {
			clearTimeout(this.#layoutChangeTimeout);
		}

		this.#layoutChangeTimeout = setTimeout(() => {
			this.#layoutChangeTimeout = null;

			const layout = this.#exportLayoutInternal();

			// Emit event for responsive controller (and any other listeners)
			this.#eventBus.dispatch('board:layoutchange', {
				board: this,
				layout,
				breakpoint: this.breakpoint
			});

			// Also call local callback if provided
			this.config$()?.onLayoutChange?.(layout);
		}, this.#layoutChangeDebounceMs);
	}

	#onResponsiveLayoutImport(event: InternalResponsiveLayoutImportEvent) {
		// Not our responsive controller
		if (event.responsiveController !== this.#responsiveController) {
			return;
		}

		// Get the layout for our breakpoint and import it
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
			// nothing to compensate for — padding as well would shift the content twice.
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
		// If they didn't bring their own key, assign one.
		key ??= this.#nextTargetKey();

		// Use the existing target if it exists.
		if (this.#targets.has(key)) {
			return this.#targets.get(key)!;
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

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
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

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
		const currentAction = this.#currentWidgetAction$();
		if (currentAction?.action === 'grab') {
			this.#eventBus.dispatch('widget:leavetarget', {
				board: this,
				target: event.target,
				widget: currentAction.widget
			});
		}

		// If it's resize, then we don't care that the pointer has left the target.
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
		// Capture source target before any handlers might change widget.internalTarget
		const sourceTarget = currentAction.widget.internalTarget;

		switch (currentAction.action) {
			case 'grab':
				this.#handleGrabbedWidgetRelease(currentAction);
				break;
			case 'resize':
				this.#handleResizingWidgetRelease(currentAction);
				break;
		}

		// Safety net: After all synchronous handlers complete, check if the source target
		// still has a pre-grab snapshot (meaning the drop didn't happen). If so, restore it.
		// This handles the case where the widget was released outside of all targets.
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

		// Capture source target before releasing the action
		const sourceTarget = this.#currentWidgetAction$()?.widget.internalTarget;
		this.#currentWidgetAction$()?.widget.captureReleaseState();

		this.#releaseCurrentWidgetAction();

		// Safety net: After all synchronous handlers complete, check if the source target
		// still has a pre-grab snapshot. If so, restore it.
		// This handles the case where the widget was cancelled while outside of all targets.
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

	oninitialloadcomplete() {
		this.#ready = true;

		// Check for stored layout from early import attempt
		if (this.#storedLoadLayout) {
			this.#importLayoutInternal(this.#storedLoadLayout);
			this.#storedLoadLayout = undefined;
			return;
		}

		// If in responsive context, load from responsive controller
		if (this.#responsiveController && this.breakpoint) {
			const layout = this.#responsiveController.getLayoutForBreakpoint(this.breakpoint);
			if (layout) {
				this.#importLayoutInternal(layout);
				return;
			}
			// Fall through to loadLayout callback if no stored layout for this breakpoint
		}

		// Check for loadLayout in config (for non-responsive boards OR first-time breakpoint)
		const loadLayoutFn = this.config$()?.loadLayout;
		if (loadLayoutFn) {
			const layout = loadLayoutFn();
			if (layout) {
				this.#importLayoutInternal(this.#normalizeLayout(layout));
			}
		}
	}

	/**
	 * Imports a layout into this board.
	 *
	 * **Note**: If this board is under a ResponsiveFlexiBoard, prefer using
	 * `responsiveBoard.importLayout()` to import layouts for all breakpoints.
	 */
	importLayout(layout: FlexiLayout) {
		if (this.#responsiveController) {
			console.warn(
				'importLayout() called directly on a FlexiBoard under ResponsiveFlexiBoard. ' +
					'Use responsiveBoard.importLayout() instead to import layouts for all breakpoints.'
			);
		}
		this.#importLayoutInternal(layout);
	}

	/**
	 * Internal implementation of importLayout - no warning, used by responsive controller.
	 */
	#importLayoutInternal(layout: FlexiLayout) {
		// The board isn't ready to import widgets yet, so we'll store the layout and import it later.
		if (!this.#ready) {
			this.#storedLoadLayout = layout;
			return;
		}

		// Good to go - import the widgets into their respective targets.
		this.#targets.forEach((target) => {
			const targetLayout = layout[target.key];
			if (targetLayout) {
				target.importLayout(targetLayout);
			}
		});
	}

	#normalizeLayout(layout: FlexiLayout | FlexiWidgetLayoutEntry[]): FlexiLayout {
		// If it's an array, assume single target (first one)
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
	 * Internal implementation of exportLayout - no warning, used internally.
	 */
	#exportLayoutInternal(): FlexiLayout {
		const result: FlexiLayout = {};

		// Grab the current layout of each target.
		this.#targets.forEach((target) => {
			result[target.key] = target.exportLayout();
		});

		return result;
	}

	#handleGrabbedWidgetRelease(action: InternalWidgetGrabAction) {
		// If a deleter is hovered, then we'll delete the widget.
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
	 * Moves a widget from one target to another.
	 * @param widget The widget to move.
	 * @param from The target to move the widget from.
	 * @param to The target to move the widget to.
	 */
	moveWidget(
		widget: InternalFlexiWidgetController,
		from: InternalFlexiTargetController | undefined,
		to: InternalFlexiTargetController
	): boolean {
		const dropSuccessful = to.tryDropWidget(widget);

		// If the widget is new, it has no from target.
		if (from) {
			from.widgets.delete(widget);
			from.forgetPreGrabSnapshot();

			// Apply deferred operations to the source target (like collapsing empty rows)
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
		// when nothing changed — an unconditional write can be re-entered by the
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
	 * Returns the parent responsive controller if this board is within a ResponsiveFlexiBoard.
	 */
	get responsiveController() {
		return this.#responsiveController;
	}

	/**
	 * Cleanup method to be called when the board is destroyed
	 */
	destroy() {
		// Clean up all targets (which will clean up their widgets)
		this.#targets.forEach((target) => target.destroy());
		this.#targets.clear();

		// Clean up the board-scoped auto-scroll service
		this.#autoScrollService.destroy();

		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];

		// Clean up any pending layout change timeout
		if (this.#layoutChangeTimeout) {
			clearTimeout(this.#layoutChangeTimeout);
			this.#layoutChangeTimeout = null;
		}
	}
}
