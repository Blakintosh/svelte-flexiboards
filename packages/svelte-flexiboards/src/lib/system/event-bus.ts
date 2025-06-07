import type { WidgetGrabbedEvent } from './types.js';

export interface EventMap {
	'widget:grabbed': WidgetGrabbedEvent;
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

export function createEventBus() {
	return new FlexiEventBus();
}
