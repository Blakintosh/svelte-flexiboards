import { getContext, setContext } from 'svelte';
import type {
	InternalAdderWidgetReadyEvent,
	InternalBoardLayoutChangeEvent,
	InternalResponsiveLayoutImportEvent,
	InternalTargetEvent,
	InternalWidgetDroppedEvent,
	InternalWidgetEvent,
	InternalWidgetGrabbedEvent,
	InternalWidgetResizingEvent
} from '../internal-types.js';
import type { PointerMovedEvent } from '../types.js';

export interface EventMap {
	'widget:grabbed': InternalWidgetGrabbedEvent;
	'widget:resizing': InternalWidgetResizingEvent;
	'widget:release': InternalWidgetEvent;
	'widget:cancel': InternalWidgetEvent;
	// Called when a release has been confirmed to be possible.
	'widget:dropped': InternalWidgetDroppedEvent;
	'widget:delete': InternalWidgetEvent;
	'target:pointerenter': InternalTargetEvent;
	'target:pointerleave': InternalTargetEvent;
	'widget:entertarget': InternalWidgetEvent;
	'widget:leavetarget': InternalWidgetEvent;
	'adder:widgetready': InternalAdderWidgetReadyEvent;
	'pointer:moved': PointerMovedEvent;
	// Fired when a board's layout changes (widget moved, resized, added, or removed)
	'board:layoutchange': InternalBoardLayoutChangeEvent;
	// Fired when a responsive controller imports a new layout
	'responsive:layoutimport': InternalResponsiveLayoutImportEvent;
}

// Event listener function type
type EventListener<T> = (data: T) => void;

export class FlexiEventBus {
	private listeners: {
		[K in keyof EventMap]?: EventListener<EventMap[K]>[];
	} = {};

	dispatch<K extends keyof EventMap>(eventName: K, data: EventMap[K]): void {
		// Notify event listeners that the event happened.
		const eventListeners = this.listeners[eventName];
		if (eventListeners) {
			// Iterate a copy: handlers may unsubscribe themselves (or others) during dispatch,
			// which would otherwise shift the array and skip listeners.
			for (const listener of [...eventListeners]) {
				listener(data);
			}
		}
	}

	subscribe<K extends keyof EventMap>(
		eventName: K,
		listener: EventListener<EventMap[K]>
	): () => void {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = [];
		}
		this.listeners[eventName]!.push(listener);

		return () => {
			const listeners = this.listeners[eventName];
			if (listeners) {
				const index = listeners.indexOf(listener);
				if (index > -1) {
					listeners.splice(index, 1);
				}
			}
		};
	}

	clear(): void {
		this.listeners = {};
	}
}

const contextKey = Symbol('flexieventbus');

let flexiEventBusInstance: FlexiEventBus | undefined = undefined;

export function getFlexiEventBus() {
	// Define event bus at time of calling, so that effect context is assured.
	if (!flexiEventBusInstance) {
		flexiEventBusInstance = new FlexiEventBus();
	}

	return flexiEventBusInstance;
}

export function flexiEventBus() {
	const eventBus = getFlexiEventBus();

	setContext(contextKey, eventBus);
	return eventBus;
}

export function getFlexiEventBusCtx() {
	const eventBus = getContext<FlexiEventBus | undefined>(contextKey);

	if (!eventBus) {
		throw new Error(
			'Cannot get FlexiEventBus context outside of a registered event bus. Ensure that flexiEventBus() is called.'
		);
	}

	return eventBus;
}
