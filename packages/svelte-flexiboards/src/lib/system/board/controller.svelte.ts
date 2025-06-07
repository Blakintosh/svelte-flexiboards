import type { FlexiBoardProps } from '$lib/components/flexi-board.svelte';
import type { AriaPoliteness, FlexiAnnouncerController } from '../announcer.svelte.js';
import { flexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
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
	FlexiSavedLayout,
	HoveredTargetEvent,
	ProxiedValue,
	WidgetAction,
	WidgetCancelEvent,
	WidgetGrabAction,
	WidgetGrabbedEvent,
	WidgetReleaseEvent,
	WidgetResizeAction,
	WidgetStartResizeEvent
} from '../types.js';
import type { FlexiWidgetController } from '../widget/base.svelte.js';
import type { FlexiBoardController } from './base.svelte.js';
import type { FlexiBoardConfiguration } from './types.js';

export class InternalFlexiBoardController implements FlexiBoardController {
	#currentWidgetAction: WidgetAction | null = $state(null);

	#targets: Map<string, InternalFlexiTargetController> = new Map();
	#hoveredTarget: InternalFlexiTargetController | null = $state(null);

	#hoveredOverDeleter: boolean = $state(false);

	#ref: ProxiedValue<HTMLElement | null> = $state({ value: null });

	#pointerService: PointerService = getPointerService();
	#autoScrollService: AutoScrollService = new AutoScrollService(this.#ref);

	#rawProps?: FlexiBoardProps = $state(undefined);
	config?: FlexiBoardConfiguration = $derived(this.#rawProps?.config);

	#nextTargetIndex = 0;

	#storedLoadLayout: FlexiSavedLayout | null = null;
	#ready: boolean = false;

	portal: FlexiPortalController | null = null;

	#announcer: FlexiAnnouncerController | null = null;

	#eventBus: FlexiEventBus;

	constructor(props: FlexiBoardProps, eventBus: FlexiEventBus) {
		// Track the props proxy so our config reactively updates.
		this.#rawProps = props;
		this.#eventBus = eventBus;

		this.#eventBus.subscribe('widget:grabbed', this.onwidgetgrabbed.bind(this));
		this.#eventBus.subscribe('widget:release', this.handleWidgetRelease.bind(this));
		this.#eventBus.subscribe('widget:cancel', this.handleWidgetCancel.bind(this));
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

		const target = new InternalFlexiTargetController(this, this.#eventBus, key, config);
		this.#targets.set(key, target);
		return target;
	}

	onpointerentertarget(event: HoveredTargetEvent) {
		this.#hoveredTarget = event.target;

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
		const currentAction = this.#currentWidgetAction;
		if (currentAction?.action === 'grab') {
			event.target.ongrabbedwidgetover({
				widget: currentAction.widget
			});
		}
	}

	onpointerleavetarget(event: HoveredTargetEvent) {
		// Failsafe in case another target is already registered as hovered.
		if (this.#hoveredTarget === event.target) {
			this.#hoveredTarget = null;
		}

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
		const currentAction = this.#currentWidgetAction;
		if (currentAction?.action === 'grab') {
			event.target.ongrabbedwidgetleave();
		}

		// If it's resize, then we don't care that the pointer has left the target.
	}

	onenterdeleter() {
		this.#hoveredOverDeleter = true;
	}

	onleavedeleter() {
		this.#hoveredOverDeleter = false;
	}

	onwidgetgrabbed(event: WidgetGrabbedEvent) {
		if (this.#currentWidgetAction) {
			return null;
		}

		if (event.clientX !== undefined && event.clientY !== undefined) {
			this.#pointerService.updatePosition(event.clientX, event.clientY);
		}

		const action: WidgetGrabAction = {
			action: 'grab',
			target: event.target,
			widget: event.widget,
			adder: event.adder,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			capturedHeightPx: event.capturedHeightPx,
			capturedWidthPx: event.capturedWidthPx
		};
		this.#currentWidgetAction = action;

		if (this.portal) {
			this.portal.moveWidgetToPortal(event.widget);
		}

		this.#lockViewport();
		this.#autoScrollService.shouldAutoScroll = true;
		this.#pointerService.keyboardControlsActive = true;

		this.announce(`You have grabbed the widget at x: ${event.widget.x}, y: ${event.widget.y}.`);

		return action;
	}

	onwidgetstartresize(event: WidgetStartResizeEvent) {
		if (this.#currentWidgetAction) {
			return null;
		}

		const action: WidgetResizeAction = {
			action: 'resize',
			target: event.target,
			widget: event.widget,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			left: event.left,
			top: event.top,
			heightPx: event.heightPx,
			widthPx: event.widthPx,
			initialHeightUnits: event.widget.height,
			initialWidthUnits: event.widget.width
		};

		this.#currentWidgetAction = action;

		if (this.portal) {
			this.portal.moveWidgetToPortal(event.widget);
		}

		this.#lockViewport();
		// TODO: re-evaluate this at a later point, as vertical sizing is a thing
		this.#autoScrollService.shouldAutoScroll = false;
		this.#pointerService.keyboardControlsActive = true;

		this.announce(`You are resizing the widget at x: ${event.widget.x}, y: ${event.widget.y}.`);

		return action;
	}

	#originalOverscrollBehaviorY: string | null = null;
	#originalTouchAction: string | null = null;

	#lockViewport() {
		this.#originalOverscrollBehaviorY = document.documentElement.style.overscrollBehaviorY;
		this.#originalTouchAction = document.documentElement.style.touchAction;

		document.documentElement.style.overscrollBehaviorY = 'contain';
		document.documentElement.style.touchAction = 'none';
	}

	#unlockViewport() {
		document.documentElement.style.overscrollBehaviorY =
			this.#originalOverscrollBehaviorY ?? 'auto';
		document.documentElement.style.touchAction = this.#originalTouchAction ?? 'auto';
	}

	handleWidgetRelease(event: WidgetReleaseEvent) {
		this.#unlockViewport();

		const currentAction = this.#currentWidgetAction!;

		switch (currentAction.action) {
			case 'grab':
				this.#handleGrabbedWidgetRelease(currentAction);
				break;
			case 'resize':
				this.#handleResizingWidgetRelease(currentAction);
				break;
		}
	}

	handleWidgetCancel(event: WidgetCancelEvent) {
		if (this.portal) {
			this.portal.returnWidgetFromPortal(event.widget);
		}
		this.#unlockViewport();
		this.#releaseCurrentWidgetAction();
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

		// if(this.#storedLoadLayout) {
		// 	this.importLayout(this.#storedLoadLayout);
		// }
	}

	// NEXT: Add import/export layout.
	// importLayout(layout: FlexiSavedLayout) {
	// 	// The board isn't ready to import widgets yet, so we'll store the layout and import it later.
	// 	if(!this.#ready) {
	// 		this.#storedLoadLayout = layout;
	// 		return;
	// 	}

	// 	// Good to go - import the widgets into their respective targets.
	// 	this.#targets.forEach(target => {
	// 		target.importLayout(layout[target.key]);
	// 	});
	// }

	// exportLayout(): FlexiSavedLayout {
	// 	const result: FlexiSavedLayout = {};

	// 	// Grab the current layout of each target.
	// 	this.#targets.forEach(target => {
	// 		result[target.key] = target.exportLayout();
	// 	});

	// 	return result;
	// }

	#handleGrabbedWidgetRelease(action: WidgetGrabAction) {
		// If a deleter is hovered, then we'll delete the widget.
		if (this.#hoveredOverDeleter) {
			action.widget.delete();
			this.#releaseCurrentWidgetAction(true);
			return;
		}

		// Now that the widget has left the portal, apply an offset to its current position to account for the board's position.
		// (Otherwise, the widget gains +board.left and +board.top to its position)
		const boardRect = this.ref?.getBoundingClientRect();
		// this isn't pretty, but should do the job.
		if (boardRect && action.widget.ref) {
			action.widget.ref.style.left = `${action.widget.ref.offsetLeft - boardRect.left}px`;
			action.widget.ref.style.top = `${action.widget.ref.offsetTop - boardRect.top}px`;
		}

		// If no target is hovered, then just release the widget.
		if (!this.#hoveredTarget) {
			this.#releaseCurrentWidgetAction();
			return;
		}

		if (action.adder) {
			action.adder.onstopwidgetdragin();
		}
		const shouldDrop = this.moveWidget(action.widget, action.target, this.#hoveredTarget);

		if (!shouldDrop) {
			this.#releaseCurrentWidgetAction();
			return;
		}

		this.#releaseCurrentWidgetAction(true);
	}

	#handleResizingWidgetRelease(action: WidgetResizeAction) {
		if (this.portal) {
			this.portal.returnWidgetFromPortal(action.widget);
		}

		// Now that the widget has left the portal, apply an offset to its current position to account for the board's position.
		// (Otherwise, the widget gains +board.left and +board.top to its position)
		const boardRect = this.ref?.getBoundingClientRect();
		// this isn't pretty, but should do the job.
		if (boardRect && action.widget.ref) {
			action.widget.ref.style.left = `${action.widget.ref.offsetLeft - boardRect.left}px`;
			action.widget.ref.style.top = `${action.widget.ref.offsetTop - boardRect.top}px`;
		}

		const success = action.target.tryDropWidget(action.widget);
		this.#releaseCurrentWidgetAction(success);
	}

	#releaseCurrentWidgetAction(actionSucceeded: boolean = false) {
		const currentWidgetAction = this.#currentWidgetAction;

		if (!currentWidgetAction) {
			return;
		}

		const widget = currentWidgetAction.widget;

		if (this.portal) {
			this.portal.returnWidgetFromPortal(widget);
		}

		// If the widget is still being grabbed, we'll need to release it.
		if (widget.currentAction) {
			widget.currentAction = null;
		}

		// If this widget is new from an adder, then it needs to remove it regardless of the outcome.
		if (currentWidgetAction.action == 'grab' && currentWidgetAction.adder) {
			currentWidgetAction.widget.adder = undefined;
			currentWidgetAction.adder.onstopwidgetdragin();
		}

		// The widget wasn't placed successfully, so go back to the pre-grab state on the target.
		if (!actionSucceeded && currentWidgetAction.target) {
			currentWidgetAction.target.cancelDrop();
			currentWidgetAction.target.restorePreGrabSnapshot();
			// Apply deferred operations after restoring (in case the restore action affected the grid)
			currentWidgetAction.target.applyGridPostCompletionOperations();
		}

		this.announce(`You have released the widget.`);

		// Disable the focus trap and auto-scroll.
		this.#autoScrollService.shouldAutoScroll = false;
		this.#pointerService.keyboardControlsActive = false;

		this.#currentWidgetAction = null;
	}

	/**
	 * Moves a widget from one target to another.
	 * @param widget The widget to move.
	 * @param from The target to move the widget from.
	 * @param to The target to move the widget to.
	 */
	moveWidget(
		widget: FlexiWidgetController,
		from: FlexiTargetController | undefined,
		to: FlexiTargetController
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
}
