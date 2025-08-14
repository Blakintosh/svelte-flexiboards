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
	FlexiSavedLayout,
	HoveredTargetEvent,
	ProxiedValue,
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
import type { FlexiBoardConfiguration } from './types.js';

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

	#nextTargetIndex = 0;

	#storedLoadLayout: FlexiSavedLayout | null = null;
	#ready: boolean = false;

	portal: FlexiPortalController | null = null;

	#announcer: FlexiAnnouncerController | null = null;

	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];

	constructor(props: FlexiBoardProps) {
		// Track the props proxy so our config reactively updates.
		this.#rawProps = props;
		this.#eventBus = getFlexiEventBus();

		this.#unsubscribers.push(
			this.#eventBus.subscribe('widget:grabbed', this.onWidgetGrabbed.bind(this)),
			this.#eventBus.subscribe('widget:resizing', this.onWidgetResizing.bind(this)),
			this.#eventBus.subscribe('widget:release', this.handleWidgetRelease.bind(this)),
			this.#eventBus.subscribe('widget:cancel', this.handleWidgetCancel.bind(this)),

			this.#eventBus.subscribe('target:pointerenter', this.onPointerEnterTarget.bind(this)),
			this.#eventBus.subscribe('target:pointerleave', this.onPointerLeaveTarget.bind(this))
		);
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

		switch (currentAction.action) {
			case 'grab':
				this.#handleGrabbedWidgetRelease(currentAction);
				break;
			case 'resize':
				this.#handleResizingWidgetRelease(currentAction);
				break;
		}
	}

	handleWidgetCancel(event: WidgetEvent) {
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
	}
}
