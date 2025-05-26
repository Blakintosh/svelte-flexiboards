import { untrack } from "svelte";
import { getFlexiboardCtx, getInternalFlexiboardCtx, type InternalFlexiBoardController } from "./provider.svelte.js";
import type { SvelteClassValue, WidgetGrabbedParams } from "./types.js";
import type { PointerService } from "./utils.svelte.js";
import { getPointerService } from "./utils.svelte.js";
import { FlexiWidgetController, type FlexiWidgetConfiguration } from "./widget.svelte.js";

export type FlexiAddWidgetFn = () => AdderWidgetConfiguration | null;

export type AdderWidgetConfiguration = {
    widget: FlexiWidgetConfiguration;
    widthPx?: number;
    heightPx?: number;
}

export class FlexiAddController {
    provider: InternalFlexiBoardController;
    #addWidget: FlexiAddWidgetFn;

    newWidget?: FlexiWidgetController = $state(undefined);

    constructor(provider: InternalFlexiBoardController, addWidgetFn: FlexiAddWidgetFn) {
        this.provider = provider;
        this.#addWidget = addWidgetFn;

        this.onpointerdown = this.onpointerdown.bind(this);
    }

    onpointerdown(event: PointerEvent) {
        const config = this.#addWidget();

        if(!config || !config.widget) {
            return;
        }
    
        // Create a widget under this FlexiAdd.
        this.newWidget = new FlexiWidgetController({
            type: "adder",
            adder: this,
            config: config.widget,
            widthPx: config.widthPx ?? 100,
            heightPx: config.heightPx ?? 100,
            clientX: event.clientX,
            clientY: event.clientY
        });
        // When the widget mounts, it'll automatically trigger the drag in event.

        // Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    onstartwidgetdragin(event: WidgetGrabbedParams) {
        return this.provider.onwidgetgrabbed({
            ...event,
            adder: this
        });
    }

    onstopwidgetdragin() {
        // Whether it got placed into a target or not, the FlexiAdd's work is done.
        this.newWidget = undefined;
    }
}

export function flexiadd(addWidgetFn: FlexiAddWidgetFn) {
    const provider = getInternalFlexiboardCtx();

    const adder = new FlexiAddController(provider, addWidgetFn);

    return {
        adder,
        onpointerdown: (event: PointerEvent) => adder.onpointerdown(event)
    }
}

export type FlexiDeleteClassFunction = (deleter: FlexiDeleteController) => SvelteClassValue;
export type FlexiDeleteClasses = SvelteClassValue | FlexiDeleteClassFunction;

export class FlexiDeleteController {
    #provider: InternalFlexiBoardController;
    #pointerService: PointerService = getPointerService();
    ref: HTMLElement | null = null;

    #inside: boolean = false;

    constructor(provider: InternalFlexiBoardController) {
        this.#provider = provider;

		// Emulate pointer enter/leave events instead of relying on browser ones, so that we can
		// make it universal with our keyboard pointer.
		$effect(() => {
			if(!this.ref) {
				return;
			}

			const isPointerInside = this.#pointerService.isPointerInside(this.ref);
			
			// Only check when keyboard controls are active
			untrack(() => {
				this.#updatePointerOverState(isPointerInside);
			});
		});
    }

    #updatePointerOverState(inside: boolean) {
        const wasHovered = this.#inside;

        if(inside && !wasHovered) {
            this.#provider.onenterdeleter();
        } else if(!inside && wasHovered) {
            this.#provider.onleavedeleter();
        }

        this.#inside = inside;
    }

    get isHovered() {
        return this.#inside;
    }
}

export function flexidelete() {
    const provider = getInternalFlexiboardCtx();
    const deleter = new FlexiDeleteController(provider);

    return {
        deleter,
        // TODO: remove in v0.4
        onpointerenter: () => { },
        onpointerleave: () => { }
    }
}