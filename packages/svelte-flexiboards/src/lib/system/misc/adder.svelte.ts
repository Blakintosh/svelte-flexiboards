import type { ClassValue } from 'svelte/elements';
import type { InternalFlexiBoardController } from '../board/controller.svelte.js';
import { getInternalFlexiboardCtx } from '../board/index.js';
import type {
	AdderWidgetReadyEvent,
	WidgetDeleteEvent,
	WidgetEvent,
	WidgetGrabbedParams
} from '../types.js';
import { InternalFlexiWidgetController } from '../widget/controller.svelte.js';
import type { FlexiWidgetConfiguration, FlexiWidgetController } from '../widget/index.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import { getContext, hasContext, onMount, setContext } from 'svelte';
import { isGrabPointerEvent } from '../shared/utils.svelte.js';

export type FlexiAddWidgetFn = () => AdderWidgetConfiguration | null;

export type AdderWidgetConfiguration = {
	widget: FlexiWidgetConfiguration;
	widthPx?: number;
	heightPx?: number;
};

export type FlexiAddClassFunction = (adder: FlexiAddController) => ClassValue;
export type FlexiAddClasses = ClassValue | FlexiAddClassFunction;

export interface FlexiAddController {
	ref: HTMLElement | null;
}

type NewWidgetDragInParams = {
	clientX: number;
	clientY: number;
	capturedHeightPx: number;
	capturedWidthPx: number;
};

export class InternalFlexiAddController implements FlexiAddController {
	provider: InternalFlexiBoardController;
	#addWidget: FlexiAddWidgetFn;

	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];

	newWidget?: InternalFlexiWidgetController = $state(undefined);

	toCreateParams: NewWidgetDragInParams | null = $state(null);

	ref: HTMLElement | null = $state(null);

	constructor(provider: InternalFlexiBoardController, addWidgetFn: FlexiAddWidgetFn) {
		this.provider = provider;
		this.#addWidget = addWidgetFn;

		this.#eventBus = getFlexiEventBus();

		this.onpointerdown = this.onpointerdown.bind(this);
		this.onkeydown = this.onkeydown.bind(this);

		this.#unsubscribers.push(
			this.#eventBus.subscribe('adder:widgetready', this.onWidgetReady.bind(this)),
			this.#eventBus.subscribe('widget:release', this.onWidgetDragInComplete.bind(this)),
			this.#eventBus.subscribe('widget:delete', this.onWidgetDragInComplete.bind(this))
		);
	}

	onpointerdown(event: PointerEvent) {
		if (!isGrabPointerEvent(event)) {
			return;
		}

		this.#initiateWidgetDragIn(event.clientX, event.clientY);

		// Don't implicitly keep the pointer capture, as then mobile can't move the widget in and out of targets.
		(event.target as HTMLElement).releasePointerCapture(event.pointerId);
		event.preventDefault();
	}

	onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || !this.ref || this.newWidget) {
			return;
		}

		const rect = this.ref.getBoundingClientRect();
		event.stopPropagation();

		this.#initiateWidgetDragIn(rect.left + rect.width / 2, rect.top + rect.height / 2);
	}

	#initiateWidgetDragIn(clientX: number, clientY: number) {
		const config = this.#addWidget();

		if (!config || !config.widget) {
			return;
		}

		// Create a widget under this FlexiAdd.
		this.newWidget = new InternalFlexiWidgetController({
			type: 'adder',
			adder: this,
			config: config.widget,
			widthPx: config.widthPx ?? 100,
			heightPx: config.heightPx ?? 100,
			clientX,
			clientY
		});
		// When the widget mounts, it'll automatically trigger the drag in event.
	}

	onWidgetReady(event: AdderWidgetReadyEvent) {
		if (event.adder !== this || !this.toCreateParams) {
			return;
		}

		// Start the grab event.
		this.#eventBus.dispatch('widget:grabbed', {
			board: this.provider,
			widget: event.widget,
			xOffset: 0,
			yOffset: 0,
			...this.toCreateParams
		});
	}

	onstartwidgetdragin(event: WidgetGrabbedParams) {
		// return this.provider.onwidgetgrabbed({
		// 	...event,
		// 	adder: this
		// });
	}

	onWidgetDragInComplete(event: { widget: InternalFlexiWidgetController }) {
		if (event.widget !== this.newWidget) {
			return;
		}

		this.#clearWidget();
	}

	#clearWidget() {
		this.newWidget = undefined;
		this.toCreateParams = null;
	}

	/**
	 * Cleanup method to be called when the adder is destroyed
	 */
	destroy() {
		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}
}

const contextKey = Symbol('flexiadd');

export function hasInternalFlexiaddCtx() {
	return hasContext(contextKey);
}

export function getInternalFlexiaddCtx() {
	const adder = getContext<InternalFlexiAddController>(contextKey);
	if (!adder) {
		// TODO: make this error message in line with others.
		throw new Error('No FlexiAdd context found. ');
	}

	return adder;
}

export function getFlexiaddCtx() {
	const adder = getContext<FlexiAddController>(contextKey);
	if (!adder) {
		// TODO: make this error message in line with others.
		throw new Error('No FlexiAdd context found. ');
	}
	return adder;
}

export function flexiadd(addWidgetFn: FlexiAddWidgetFn) {
	const provider = getInternalFlexiboardCtx();

	const adder = new InternalFlexiAddController(provider, addWidgetFn);
	setContext(contextKey, adder);

	return {
		adder,
		onpointerdown: (event: PointerEvent) => adder.onpointerdown(event),
		onkeydown: (event: KeyboardEvent) => adder.onkeydown(event)
	};
}

export function dragInOnceMounted(widget: InternalFlexiWidgetController) {
	const adder = getInternalFlexiaddCtx();
	const eventBus = getFlexiEventBus();

	onMount(() => {
		eventBus.dispatch('adder:widgetready', {
			adder,
			widget
		});
	});
}
