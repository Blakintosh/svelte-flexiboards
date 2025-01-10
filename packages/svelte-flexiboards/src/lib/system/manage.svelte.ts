import { getFlexiboardCtx, type FlexiBoard } from "./provider.svelte.js";
import type { WidgetGrabbedEvent } from "./types.js";
import { FlexiWidget, type FlexiWidgetConfiguration } from "./widget.svelte.js";

export type FlexiAddWidgetFn = () => FlexiWidgetConfiguration | null;

export class FlexiAdd {
    #provider: FlexiBoard;
    #addWidget: FlexiAddWidgetFn;

    newWidget?: FlexiWidget = $state(undefined);

    constructor(provider: FlexiBoard, addWidgetFn: FlexiAddWidgetFn) {
        this.#provider = provider;
        this.#addWidget = addWidgetFn;

        this.onpointerdown = this.onpointerdown.bind(this);
    }

    onpointerdown(event: PointerEvent) {
        const widgetConfiguration = this.#addWidget();

        if(!widgetConfiguration) {
            return;
        }
    
        // Create a widget under this FlexiAdd, which will automatically place it into a grabbed state.
        // TODO: pass some width and height into this
        this.newWidget = new FlexiWidget({
            type: "adder",
            adder: this,
            config: widgetConfiguration
        });

        // Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
        (event.target as HTMLElement).releasePointerCapture(event.pointerId);
        event.preventDefault();
    }

    onstartwidgetdragin(event: WidgetGrabbedEvent) {
        return this.#provider.onwidgetgrabbed(event);
    }

    onstopwidgetdragin() {
        // Whether it got placed into a target or not, the FlexiAdd's work is done.
        this.newWidget = undefined;
    }
}

export function flexiadd(addWidgetFn: FlexiAddWidgetFn) {
    const provider = getFlexiboardCtx();

    const adder = new FlexiAdd(provider, addWidgetFn);

    return {
        adder,
        onpointerdown: (event: PointerEvent) => adder.onpointerdown(event)
    }
}

export function flexidelete() {
    const provider = getFlexiboardCtx();

    return {
        onpointerenter: () => provider.onenterdeleter(),
        onpointerleave: () => provider.onleavedeleter()
    }
}