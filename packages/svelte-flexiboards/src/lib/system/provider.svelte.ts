import { getContext, setContext } from "svelte";
import type { GrabbedWidget, HoveredTargetEvent, WidgetDroppedEvent, WidgetGrabbedEvent } from "./types.js";
import type { FlexiTarget, FlexiTargetDefaults } from "./target.svelte.js";
import type { FlexiWidget, FlexiWidgetDefaults } from "./widget.svelte.js";
import { PointerPositionWatcher } from "./utils.svelte.js";
import type { FlexiBoardProps } from "$lib/components/flexi-board.svelte";

export type FlexiBoardConfiguration = {
    widgetDefaults?: FlexiWidgetDefaults;
    targetDefaults?: FlexiTargetDefaults;
};

export class FlexiBoard {
	grabbed: GrabbedWidget | null = $state(null);

	#targets: FlexiTarget[] = $state([]);
	#hoveredTarget: FlexiTarget | null = $state(null);

	#ref: { ref: HTMLElement | null } = $state({ ref: null});

	#positionWatcher: PointerPositionWatcher = new PointerPositionWatcher(this.#ref);

	#rawProps?: FlexiBoardProps = $state(undefined);
	config?: FlexiBoardConfiguration = $derived(this.#rawProps?.config);

	style: string = $derived.by(() => {
		if(!this.grabbed) {
			return 'position: relative;';
		}

		return `position: relative; overflow: hidden;`;
	})
	
	constructor(props: FlexiBoardProps) {
		this.#targets = [];
		// Track the props proxy so our config reactively updates.
		this.#rawProps = props;

		$inspect("draggable?", this.config?.widgetDefaults?.draggable);

		this.onPointerUp = this.onPointerUp.bind(this);

        $effect(() => {
            window.addEventListener('pointerup', this.onPointerUp);

            return () => {
				window.removeEventListener('pointerup', this.onPointerUp);
			};
        });

		// $inspect(this.#locator.position);
	}

	addTarget(target: FlexiTarget) {
		this.#targets.push(target);
	}

	onpointerentertarget(event: HoveredTargetEvent) {
		this.#hoveredTarget = event.target;

		// If a widget is currently being grabbed, propagate a grabbed widget over event to this target.
		if(this.grabbed) {
			event.target.ongrabbedwidgetover({
				widget: this.grabbed.widget
			});
		}
	}

	onpointerleavetarget(event: HoveredTargetEvent) {
		// Failsafe in case another target is already registered as hovered.
		if(this.#hoveredTarget === event.target) {
			this.#hoveredTarget = null;
		}

		if(this.grabbed) {
			event.target.ongrabbedwidgetleave();
		}
	}

	onwidgetgrabbed(event: WidgetGrabbedEvent) {
		this.grabbed = {
			target: event.target,
			widget: event.widget,
			offsetX: event.xOffset,
			offsetY: event.yOffset,
			capturedHeight: event.capturedHeight,
			capturedWidth: event.capturedWidth,
			positionWatcher: this.#positionWatcher
		};

		this.#lockViewport();

		event.target.ongrabbedwidgetover({
			widget: event.widget
		});

		return this.grabbed;
	}

	#lockViewport() {
        document.documentElement.style.overscrollBehaviorY = 'contain';
        document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.touchAction = 'none';

		this.stopScroll = this.stopScroll.bind(this);

		document.addEventListener('touchmove', this.stopScroll, { passive: false });
	}

	#unlockViewport() {
		console.log("Unlocking viewport");

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

	onPointerUp(event: PointerEvent) {
		if(!this.grabbed) {
			return;
		}

		this.handleWidgetRelease();
	}

	handleWidgetRelease() {
		this.#unlockViewport();

		// Move the widget to the hovered target if it exists.
		if(this.#hoveredTarget) {
			let defaultPrevented = false;

			const event: WidgetDroppedEvent = {
				widget: this.grabbed.widget,
				// The target can call preventDefault to prevent the widget from being dropped, e.g. if it doesn't fit.
				preventDefault: () => {
					defaultPrevented = true;
				}
			};
			
			this.#hoveredTarget.onwidgetdropped(event);

			if(defaultPrevented) {
				this.grabbed.widget.grabbed = null;
				this.grabbed = null;
				return;
			}
			this.moveWidget(this.grabbed.widget, this.grabbed.target, this.#hoveredTarget);
		}

		// If the widget is still being grabbed, we'll need to release it.
		if(this.grabbed?.widget?.grabbed) {
			this.grabbed.widget.grabbed = null;
		}

		this.grabbed = null;
	}

	/**
	 * Moves a widget from one target to another.
	 * @param widget The widget to move.
	 * @param from The target to move the widget from.
	 * @param to The target to move the widget to.
	 */
	moveWidget(widget: FlexiWidget, from: FlexiTarget, to: FlexiTarget) {
		from.widgets.delete(widget);

		widget.target = to;
		to.widgets.add(widget);
	}

	set ref(ref: HTMLElement | null) {
		this.#ref.ref = ref;
	}
}

const contextKey = Symbol('flexiboard');

export function flexiboard(props: FlexiBoardProps) {
    const board = new FlexiBoard(props);
    
    setContext(contextKey, board);
    return board;
}

/**
 * Gets the current {@link FlexiBoard} instance, if any.
 * @returns A {@link FlexiBoard} instance, otherwise `undefined`.
 */
export function getFlexiboardCtx() {
    const board = getContext<FlexiBoard | undefined>(contextKey);

    // No provider to attach to.
    if(!board) {
        throw new Error("Cannot get FlexiBoard context outside of a registered board. Ensure that flexiboard() (or <FlexiProvider>) is called.");
    }

    return board;
}