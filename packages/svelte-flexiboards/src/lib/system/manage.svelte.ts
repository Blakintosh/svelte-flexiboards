import { getFlexiboardCtx, getInternalFlexiboardCtx, type InternalFlexiBoardController } from "./provider.svelte.js";
import type { WidgetGrabbedParams } from "./types.js";
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
            heightPx: config.heightPx ?? 100
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

export function flexidelete() {
    const provider = getInternalFlexiboardCtx();

    return {
        onpointerenter: () => provider.onenterdeleter(),
        onpointerleave: () => provider.onleavedeleter()
    }
}