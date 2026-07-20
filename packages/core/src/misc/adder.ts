import type { InternalFlexiBoardController } from '../board/controller.js';
import type { InternalAdderWidgetReadyEvent } from '../internal-types.js';
import { InternalFlexiWidgetController } from '../widget/controller.js';
import type { FlexiWidgetConfiguration } from '../widget/index.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import { isGrabPointerEvent } from '../shared/utils.js';
import type { ClassValue, Signal } from '../types.js';
import { signal } from '../reactivity.js';

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

	newWidget$: Signal<InternalFlexiWidgetController | undefined> = signal(undefined);

	toCreateParams$: Signal<NewWidgetDragInParams | null> = signal(null);

	ref$: Signal<HTMLElement | null> = signal(null);

	constructor(provider: InternalFlexiBoardController, addWidgetFn: FlexiAddWidgetFn) {
		this.provider = provider;
		this.#addWidget = addWidgetFn;

		this.#eventBus = getFlexiEventBus();

		this.onpointerdown = this.onpointerdown.bind(this);
		this.onkeydown = this.onkeydown.bind(this);

		this.#unsubscribers.push(
			this.#eventBus.subscribe('adder:widgetready', this.onWidgetReady.bind(this)),
			this.#eventBus.subscribe('widget:cancel', this.onWidgetDragInCancel.bind(this)),
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
		const ref = this.ref$();
		if (event.key !== 'Enter' || !ref || this.newWidget$()) {
			return;
		}

		const rect = ref.getBoundingClientRect();
		event.stopPropagation();

		this.#initiateWidgetDragIn(rect.left + rect.width / 2, rect.top + rect.height / 2);
	}

	#initiateWidgetDragIn(clientX: number, clientY: number) {
		const config = this.#addWidget();

		if (!config || !config.widget) {
			return;
		}

		// Create a widget under this FlexiAdd.
		this.newWidget$(
			new InternalFlexiWidgetController({
				config: config.widget,
				provider: this.provider
			})
		);

		this.toCreateParams$({
			clientX,
			clientY,
			capturedHeightPx: config.heightPx ?? 100,
			capturedWidthPx: config.widthPx ?? 100
		});
		// When the widget mounts, it'll automatically trigger the drag in event.
	}

	onWidgetReady(event: InternalAdderWidgetReadyEvent) {
		const toCreateParams = this.toCreateParams$();
		if (event.adder !== this || !toCreateParams) {
			return;
		}

		// Start the grab event.
		this.#eventBus.dispatch('widget:grabbed', {
			board: this.provider,
			widget: event.widget,
			xOffset: 0,
			yOffset: 0,
			...toCreateParams
		});
	}

	onWidgetDragInComplete(event: { widget: InternalFlexiWidgetController }) {
		if (event.widget !== this.newWidget$()) {
			return;
		}

		this.#clearWidget();
	}

	onWidgetDragInCancel(event: { widget: InternalFlexiWidgetController }) {
		if (event.widget !== this.newWidget$()) {
			return;
		}
		this.#clearWidget();
	}

	#clearWidget() {
		this.newWidget$(undefined);
		this.toCreateParams$(null);
	}

	/**
	 * Cleanup method to be called when the adder is destroyed
	 */
	destroy() {
		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}

	get ref() {
		return this.ref$();
	}
	set ref(value: HTMLElement | null) {
		this.ref$(value);
	}
}

// TODO(adapter): removed hasInternalFlexiaddCtx() — context presence check for an enclosing FlexiAdd.
// TODO(adapter): removed getInternalFlexiaddCtx() — context getter returning the internal adder controller.
// TODO(adapter): removed getFlexiaddCtx() — context getter narrowing to the public FlexiAddController.
// TODO(adapter): removed flexiadd(addWidgetFn) — composition root that read the board context, constructed
// InternalFlexiAddController(provider, addWidgetFn), set the adder context, and returned the adder alongside
// its bound onpointerdown/onkeydown handlers for the adapter's element to wire up.

/**
 * Dispatches the adder's widget-ready event once the newly created widget has mounted,
 * triggering the drag-in. Call at mount time (the adapter's responsibility) for widgets
 * rendered under a FlexiAdd.
 */
export function dragInOnceMounted(
	adder: InternalFlexiAddController,
	widget: InternalFlexiWidgetController
) {
	const eventBus = getFlexiEventBus();

	eventBus.dispatch('adder:widgetready', {
		adder,
		widget
	});
}
