import type { FlexiBoardProps } from '$lib/components/flexi-board.svelte';
import type { AriaPoliteness, FlexiAnnouncerController } from '../announcer.svelte.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import type { FlexiPortalController } from '../portal.js';
import {
	AutoScrollService,
	getPointerService,
	type PointerService
} from '../shared/utils.svelte.js';
import type { FlexiTargetController } from '../target/base.svelte.js';
import { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { FlexiTargetPartialConfiguration } from '../target/types.js';
import type {
	HoveredTargetEvent,
	ProxiedValue,
	ResponsiveLayoutImportEvent,
	TargetEvent,
	WidgetAction,
	WidgetEvent,
	WidgetGrabAction,
	WidgetGrabbedEvent,
	WidgetResizeAction,
	WidgetResizingEvent,
	WidgetStartResizeEvent
} from '../types.js';
import type { FlexiWidgetController } from '../widget/base.svelte.js';
import type { FlexiBoardController } from './base.svelte.js';
import type { FlexiBoardConfiguration, FlexiRegistryEntry, FlexiLayout, FlexiWidgetLayoutEntry } from './types.js';
import type { InternalFlexiWidgetController } from '../widget/controller.svelte.js';
import { getInternalResponsiveFlexiboardCtx, hasInternalResponsiveFlexiboardCtx } from '../responsive/index.js';
import type { InternalResponsiveFlexiBoardController } from '../responsive/controller.svelte.js';

export class InternalFlexiBoardController implements FlexiBoardController {
	#currentWidgetAction: WidgetAction | null = $state(null);

	#targets: Map<string, InternalFlexiTargetController> = new Map();
	hoveredTarget: InternalFlexiTargetController | null = null;

	#hoveredOverDeleter: boolean = $state(false);

	#ref: ProxiedValue<HTMLElement | null> = $state({ value: null });

	#pointerService: PointerService = getPointerService();
	#autoScrollService: AutoScrollService = new AutoScrollService(this.#ref);

	#rawProps?: FlexiBoardProps = $state(undefined);
	config?: FlexiBoardConfiguration = $derived(this.#rawProps?.config);

	registry?: Record<string, FlexiRegistryEntry> = $derived(this.#rawProps?.config?.registry);

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

	constructor(props: FlexiBoardProps) {
		// Track the props proxy so our config reactively updates.
		this.#rawProps = props;
		this.#eventBus = getFlexiEventBus();

		// Check if we're inside a responsive context
		if (hasInternalResponsiveFlexiboardCtx()) {
			this.#responsiveController = getInternalResponsiveFlexiboardCtx();
			// Infer breakpoint from responsive controller's current state
			this.breakpoint = this.#responsiveController.currentBreakpoint;
		} else {
			// Not in responsive context - use config breakpoint if provided (with warning)
			this.breakpoint = this.#rawProps?.config?.breakpoint;
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
			this.config?.onLayoutChange?.(layout);
		}, this.#layoutChangeDebounceMs);
	}

	#onResponsiveLayoutImport(event: ResponsiveLayoutImportEvent) {
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

	style: string = $derived.by(() => {
		if (!this.#currentWidgetAction) {
			return 'position: relative;';
		}

		return `position: relative; ${this.#getStyleForCurrentWidgetAction()}`;
	});

	#getStyleForCurrentWidgetAction() {
		if (!this.#currentWidgetAction) {
			return '';
		}

		switch (this.#currentWidgetAction.action) {
			case 'grab':
				return `cursor: grabbing;`;
			case 'resize':
				return `cursor: nwse-resize;`;
		}
	}

	get ref() {
		return this.#ref.value;
	}

	set ref(ref: HTMLElement | null) {
		this.#ref.value = ref;
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

	onPointerEnterTarget(event: TargetEvent) {
		if (event.board != this) {
			return;
		}

		this.hoveredTarget = event.target;

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
		const currentAction = this.#currentWidgetAction;
		if (currentAction?.action === 'grab') {
			this.#eventBus.dispatch('widget:entertarget', {
				board: this,
				target: event.target,
				widget: currentAction.widget
			});
		}
	}

	onPointerLeaveTarget(event: TargetEvent) {
		if (event.board != this) {
			return;
		}

		// Failsafe in case another target is already registered as hovered.
		if (this.hoveredTarget === event.target) {
			this.hoveredTarget = null;
		}

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
		const currentAction = this.#currentWidgetAction;
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
		this.#hoveredOverDeleter = true;
	}

	onleavedeleter() {
		this.#hoveredOverDeleter = false;
	}

	onWidgetGrabbed(event: WidgetGrabbedEvent) {
		if (this.#currentWidgetAction || event.board !== this) {
			return;
		}

		if (event.clientX !== undefined && event.clientY !== undefined) {
			this.#pointerService.updatePosition(event.clientX, event.clientY);
		}

		const action: WidgetGrabAction = {
			action: 'grab',
			widget: event.widget,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			capturedHeightPx: event.capturedHeightPx,
			capturedWidthPx: event.capturedWidthPx
		};
		this.#currentWidgetAction = action;

		this.#lockViewport();

		this.announce(`You have grabbed the widget at x: ${event.widget.x}, y: ${event.widget.y}.`);
	}

	onWidgetResizing(event: WidgetResizingEvent) {
		if (this.#currentWidgetAction || event.board !== this) {
			return;
		}

		this.#currentWidgetAction = {
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
		};

		this.#lockViewport();
		this.announce(`You are resizing the widget at x: ${event.widget.x}, y: ${event.widget.y}.`);
	}

	#originalOverscrollBehaviorY: string | null = null;
	#originalTouchAction: string | null = null;
	#originalUserSelect: string | null = null;

	#lockViewport() {
		this.#originalOverscrollBehaviorY = document.documentElement.style.overscrollBehaviorY;
		this.#originalTouchAction = document.documentElement.style.touchAction;
		this.#originalUserSelect = document.documentElement.style.userSelect;

		document.documentElement.style.overscrollBehaviorY = 'contain';
		document.documentElement.style.touchAction = 'none';
		document.documentElement.style.userSelect = 'none';
	}

	#unlockViewport() {
		document.documentElement.style.overscrollBehaviorY =
			this.#originalOverscrollBehaviorY ?? 'auto';
		document.documentElement.style.touchAction = this.#originalTouchAction ?? 'auto';
		document.documentElement.style.userSelect = this.#originalUserSelect ?? 'auto';
	}

	handleWidgetRelease(event: WidgetEvent) {
		// Not our event.
		if (event.board !== this) {
			return;
		}

		this.#unlockViewport();

		const currentAction = this.#currentWidgetAction!;
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

	handleWidgetCancel(event: WidgetEvent) {
		// Not our event.
		if (event.board !== this) {
			return;
		}

		this.#unlockViewport();

		// Capture source target before releasing the action
		const sourceTarget = this.#currentWidgetAction?.widget.internalTarget;

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
		const loadLayoutFn = this.config?.loadLayout;
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
		this.#targets.forEach(target => {
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
		this.#targets.forEach(target => {
			result[target.key] = target.exportLayout();
		});

		return result;
	}

	#handleGrabbedWidgetRelease(action: WidgetGrabAction) {
		// If a deleter is hovered, then we'll delete the widget.
		if (this.#hoveredOverDeleter) {
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

	#handleResizingWidgetRelease(action: WidgetResizeAction) {
		this.#releaseCurrentWidgetAction();
	}

	#releaseCurrentWidgetAction() {
		const currentWidgetAction = this.#currentWidgetAction;

		if (!currentWidgetAction) {
			return;
		}

		this.announce(`You have released the widget.`);
		this.#currentWidgetAction = null;
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
		return this.#currentWidgetAction;
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
