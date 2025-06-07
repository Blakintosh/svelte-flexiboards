import { getContext, setContext } from 'svelte';
import type { WidgetGrabbedEvent, WidgetResizingEvent } from '../types.js';

export interface EventMap {
	'widget:grabbed': WidgetGrabbedEvent;
	'widget:resizing': WidgetResizingEvent;
}

// Event listener function type
type EventListener<T> = (data: T) => void;

export class FlexiEventBus {
	private listeners: {
		[K in keyof EventMap]?: EventListener<EventMap[K]>[];
	} = {};

	dispatch<K extends keyof EventMap>(eventName: K, data: EventMap[K]): void {
		// Notify event listeners that the event happened.
		console.log('[event-bus] dispatching event', eventName, data);
		const eventListeners = this.listeners[eventName];
		if (eventListeners) {
			eventListeners.forEach((listener) => listener(data));
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

export function flexiEventBus() {
	const eventBus = new FlexiEventBus();

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
