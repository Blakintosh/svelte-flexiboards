import { getContext, setContext } from "svelte";
import type { FlexiBoardConfiguration, WidgetDroppedEvent, WidgetGrabbedEvent } from "./types.js";
import type { FlexiTarget } from "./target.svelte.js";
import type { FlexiWidget } from "./widget.svelte.js";
import { MousePositionWatcher } from "./utils.svelte.js";

class FlexiBoard {
	grabbed: GrabbedWidget | null = $state(null);

	#targets: FlexiTarget[] = $state([]);
	#hoveredTarget: FlexiTarget | null = $state(null);

	#ref: { ref: HTMLElement | null } = $state({ ref: null});

	#positionWatcher: MousePositionWatcher = new MousePositionWatcher(this.#ref);

	config?: FlexiBoardConfiguration = $state(undefined);

	style: string = $derived.by(() => {
		if(!this.grabbed) {
			return '';
		}

		return `overflow: hidden;`;
	})
	
	constructor(config?: FlexiBoardConfiguration) {
		this.#targets = [];
		this.config = config;

		this.onMouseUp = this.onMouseUp.bind(this);

        $effect(() => {
            window.addEventListener('mouseup', this.onMouseUp);

            return () => window.removeEventListener('mouseup', this.onMouseUp);
        });

		// $inspect(this.#locator.position);
	}

	addTarget(target: FlexiTarget) {
		// Get the index of the target in the array.
		const index = this.#targets.length;

		this.#targets.push(target);

		return {
			onmouseenter: () => {
				this.#hoveredTarget = target;

				if(this.grabbed) {
					target.widgetOver = this.grabbed.widget;
					target.ongrabbedwidgetover({
						widget: this.grabbed.widget
					});
				}
				
				// Inform the target that it is hovered.
				target.hovered = true;
			},
			onmouseleave: () => {
				// Failsafe in case another target is already registered as hovered.
				if(this.#hoveredTarget === this.#targets[index]) {
					this.#hoveredTarget = null;
				}

				if(target.widgetOver) {
					target.widgetOver = null;
				}

				// Inform the target that it is no longer hovered.
				target.hovered = false;
			}
		};
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
		return this.grabbed;
	}

	onMouseUp(event: MouseEvent) {
		if(!this.grabbed) {
			return;
		}

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

type GrabbedWidget = {
	widget: FlexiWidget;
	target?: FlexiTarget;
	offsetX: number;
	offsetY: number;
	capturedHeight: number;
	capturedWidth: number;
}

const contextKey = Symbol('flexiboard');

function flexiboard(config?: FlexiBoardConfiguration) {
    const board = new FlexiBoard(config);
    
    setContext(contextKey, board);
    return board;
}

/**
 * Gets the current {@link FlexiBoard} instance, if any.
 * @returns A {@link FlexiBoard} instance, otherwise `undefined`.
 */
function getFlexiboardCtx() {
    const board = getContext<FlexiBoard | undefined>(contextKey);

    // No provider to attach to.
    if(!board) {
        throw new Error("Cannot get FlexiBoard context outside of a registered board. Ensure that flexiboard() (or <FlexiProvider>) is called.");
    }

    return board;
}

export {
	type FlexiBoard,
	type GrabbedWidget,
	flexiboard,
	getFlexiboardCtx
}