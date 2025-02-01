import { getContext, setContext } from "svelte";
import type { WidgetAction, HoveredTargetEvent, WidgetDroppedEvent, WidgetGrabbedParams, WidgetStartResizeParams, WidgetGrabAction, WidgetResizeAction, FlexiSavedLayout, ProxiedValue, WidgetGrabbedEvent, WidgetStartResizeEvent } from "./types.js";
import type { InternalFlexiTargetController, FlexiTargetDefaults, FlexiTargetController } from "./target.svelte.js";
import type { FlexiWidgetController, FlexiWidgetDefaults } from "./widget.svelte.js";
import { PointerPositionWatcher } from "./utils.svelte.js";
import type { FlexiBoardProps } from "$lib/components/flexi-board.svelte";
import type { FlexiTarget } from "$lib/index.js";

export type FlexiBoardConfiguration = {
    widgetDefaults?: FlexiWidgetDefaults;
    targetDefaults?: FlexiTargetDefaults;
};

export interface FlexiBoardController {
	/**
	 * The reactive styling to apply to the board's root element.
	 */
	style: string;

	/**
	 * The reactive DOM reference to the board's root element.
	 */
	ref: HTMLElement | null;

	/**
	 * Moves an existing widget from one target to another.
	 * @param widget The widget to move.
	 * @param from The target to move the widget from.
	 * @param to The target to move the widget to.
	 */
	moveWidget(widget: FlexiWidgetController, from: FlexiTargetController | undefined, to: FlexiTargetController): void;

	// NEXT: Add import/export layout.
	/**
	 * Imports a widget layout into the board.
	 * @param layout The widget layout to import.
	 */
	// importLayout(layout: FlexiSavedLayout): void;

	/**
	 * Exports the current widget layout of the board.
	 * @returns The current widget layout of the board.
	 */
	// exportLayout(): FlexiSavedLayout;
}

export class InternalFlexiBoardController implements FlexiBoardController {
	#currentWidgetAction: WidgetAction | null = $state(null);

	#targets: Map<string, InternalFlexiTargetController> = new Map();
	#hoveredTarget: InternalFlexiTargetController | null = $state(null);

	#hoveredOverDeleter: boolean = $state(false);

	#ref: ProxiedValue<HTMLElement | null> = $state({ value: null });

	#positionWatcher: PointerPositionWatcher = new PointerPositionWatcher(this.#ref);

	#rawProps?: FlexiBoardProps = $state(undefined);
	config?: FlexiBoardConfiguration = $derived(this.#rawProps?.config);

	#nextTargetIndex = 0;

	#storedLoadLayout: FlexiSavedLayout | null = null;
	#ready: boolean = false;
	
	constructor(props: FlexiBoardProps) {
		// Track the props proxy so our config reactively updates.
		this.#rawProps = props;

		const onpointerup = this.#onpointerup.bind(this);
        $effect(() => {
            window.addEventListener('pointerup', onpointerup);

            return () => {
				window.removeEventListener('pointerup', onpointerup);
			};
        });
	}

	style: string = $derived.by(() => {
		if(!this.#currentWidgetAction) {
			return 'position: relative;';
		}

		return `position: relative; overflow: hidden; ${this.#getStyleForCurrentWidgetAction()}`;
	});

	#getStyleForCurrentWidgetAction() {
		if(!this.#currentWidgetAction) {
			return '';
		}

		switch(this.#currentWidgetAction.action) {
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

	addTarget(target: InternalFlexiTargetController, key?: string) {
		// If they didn't bring their own key, assign one.
		key ??= this.#nextTargetKey();

		if(this.#targets.has(key)) {
			throw new Error(`A duplicate key, '${key}' was used during the instantiation of a FlexiTarget. Ensure that all FlexiTarget keys are unique.`);
		}

		this.#targets.set(key, target);

		return key;
	}

	onpointerentertarget(event: HoveredTargetEvent) {
		this.#hoveredTarget = event.target;

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
		const currentAction = this.#currentWidgetAction;
		if(currentAction?.action === 'grab') {
			event.target.ongrabbedwidgetover({
				widget: currentAction.widget
			});
		}
	}

	onpointerleavetarget(event: HoveredTargetEvent) {
		// Failsafe in case another target is already registered as hovered.
		if(this.#hoveredTarget === event.target) {
			this.#hoveredTarget = null;
		}

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
		const currentAction = this.#currentWidgetAction;
		if(currentAction?.action === 'grab') {
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
		if(this.#currentWidgetAction) {
			return null;
		}

		const action: WidgetGrabAction = {
			action: 'grab',
			target: event.target,
			widget: event.widget,
			adder: event.adder,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			capturedHeightPx: event.capturedHeight,
			capturedWidthPx: event.capturedWidth,
			positionWatcher: this.#positionWatcher
		};
		this.#currentWidgetAction = action;

		this.#lockViewport();

		// Only matters if the event source is a target, which isn't the case when the widget is being dragged into the board.
		if(event.target) {
			event.target.ongrabbedwidgetover({
				widget: event.widget
			});
		}


		return action;
	}

	onwidgetstartresize(event: WidgetStartResizeEvent) {
		if(this.#currentWidgetAction) {
			return null;
		}

		const providerRef = this.ref;
		if(!providerRef) {
			throw new Error("Provider ref is not set");
		}

		const providerRect = providerRef.getBoundingClientRect();
		
		const action: WidgetResizeAction = {
			action: 'resize',
			target: event.target,
			widget: event.widget,
			offsetX: event.xOffset - providerRect.left,
			offsetY: event.yOffset - providerRect.top,
			left: event.left - providerRect.left,
			top: event.top - providerRect.top,
			heightPx: event.heightPx,
			widthPx: event.widthPx,
			initialHeightUnits: event.widget.height,
			initialWidthUnits: event.widget.width,
			positionWatcher: this.#positionWatcher
		};

		this.#currentWidgetAction = action;

		this.#lockViewport();

		return action;
	}

	#lockViewport() {
        document.documentElement.style.overscrollBehaviorY = 'contain';
        document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.touchAction = 'none';

		this.stopScroll = this.stopScroll.bind(this);

		document.addEventListener('touchmove', this.stopScroll, { passive: false });
	}

	#unlockViewport() {
        document.documentElement.style.overscrollBehaviorY = 'auto';
        document.documentElement.style.overflow = 'auto';
		document.documentElement.style.touchAction = 'auto';
		
		document.removeEventListener('touchmove', this.stopScroll);
	}

	stopScroll(event: TouchEvent) {
		// If a scroll is in progress, there's nothing we can do to stop it and so we'll just release the widget.
		if(!event.cancelable) {
			this.handleWidgetRelease();
			return;
		}

		event.preventDefault();
	}

	#onpointerup(event: PointerEvent) {
		if(!this.#currentWidgetAction) {
			return;
		}

		this.handleWidgetRelease();
	}

	handleWidgetRelease() {
		this.#unlockViewport();

		const currentAction = this.#currentWidgetAction!;

		switch(currentAction.action) {
			case 'grab':
				this.#handleGrabbedWidgetRelease(currentAction);
				break;
			case 'resize':
				this.#handleResizingWidgetRelease(currentAction);
				break;
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
		if(this.#hoveredOverDeleter) {
			action.widget.delete();
			this.#currentWidgetAction = null;
			return;
		}

		// If no target is hovered, then just release the widget.
		if(!this.#hoveredTarget) {
			this.#releaseCurrentWidgetAction();
			return;
		}

		if(action.adder) {
			action.adder.onstopwidgetdragin();
		}
		const shouldDrop = this.moveWidget(action.widget, action.target, this.#hoveredTarget);

		if(!shouldDrop) {
			this.#releaseCurrentWidgetAction();
			return;
		}

		this.#releaseCurrentWidgetAction(true);
	}

	#handleResizingWidgetRelease(action: WidgetResizeAction) {
		action.target.tryDropWidget(action.widget);
		this.#releaseCurrentWidgetAction();
	}

	#releaseCurrentWidgetAction(actionSucceeded: boolean = false) {
		const currentWidgetAction = this.#currentWidgetAction;

		if(!currentWidgetAction) {
			return;
		}

		const widget = currentWidgetAction.widget;

		// If the widget is still being grabbed, we'll need to release it.
		if(widget.currentAction) {
			widget.currentAction = null;
		}

		// If this widget is new from an adder, then it needs to remove it regardless of the outcome.
		if(currentWidgetAction.action == "grab" && currentWidgetAction.adder) {
			currentWidgetAction.widget.adder = undefined;
			currentWidgetAction.adder.onstopwidgetdragin();
		}

		// The widget wasn't placed successfully, so go back to the pre-grab state on the target.
		if(!actionSucceeded && currentWidgetAction.target) {
			currentWidgetAction.target.restorePreGrabSnapshot();
		}

		this.#currentWidgetAction = null;
	}

	/**
	 * Moves a widget from one target to another.
	 * @param widget The widget to move.
	 * @param from The target to move the widget from.
	 * @param to The target to move the widget to.
	 */
	moveWidget(widget: FlexiWidgetController, from: FlexiTargetController | undefined, to: FlexiTargetController): boolean {
		let defaultPrevented = false;
		
		const dropSuccessful = to.tryDropWidget(widget);

		if(defaultPrevented) {
			return false;
		}

		// If the widget is new, it has no from target.
		if(from) {
			from.widgets.delete(widget);
			from.forgetPreGrabSnapshot();
		}

		widget.target = to;
		to.widgets.add(widget);
		return true;
	}

	#nextTargetKey() {
		return `target-${this.#nextTargetIndex++}`;
	}
}

const contextKey = Symbol('flexiboard');

export function flexiboard(props: FlexiBoardProps) {
    const board = new InternalFlexiBoardController(props);
    
    setContext(contextKey, board);
    return board as FlexiBoardController;
}

/**
 * Gets the current {@link InternalFlexiBoardController} instance, if any. Throws an error if no board is found.
 * @internal
 * @returns An {@link InternalFlexiBoardController} instance.
 */
export function getInternalFlexiboardCtx() {
    const board = getContext<InternalFlexiBoardController | undefined>(contextKey);

    // No provider to attach to.
    if(!board) {
        throw new Error("Cannot get FlexiBoard context outside of a registered board. Ensure that flexiboard() (or <FlexiProvider>) is called.");
    }

    return board;
}

/**
 * Gets the current {@link FlexiBoard} instance, if any. Throws an error if no board is found.
 * @internal
 * @returns A {@link FlexiBoard} instance.
 */
export function getFlexiboardCtx() {
	return getInternalFlexiboardCtx() as FlexiBoardController;
}