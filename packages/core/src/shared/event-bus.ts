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
		// console.log('[event-bus] dispatching event', eventName, data);
		const eventListeners = this.listeners[eventName];

		if (!eventListeners) {
			return;
		}

		// Iterated over a copy, because handlers may subscribe or unsubscribe
		// while the event is being dispatched.
		for (const listener of [...eventListeners]) {
			try {
				listener(data);
			} catch (error) {
				// Subscribers are independent, and the release/cancel events are
				// what drive cleanup — returning portalled widgets to the DOM,
				// unlocking the viewport, clearing action state. Letting one
				// failure abort the rest leaves the board visibly stuck, so
				// failures are contained and surfaced rather than propagated.
				console.error(`[flexiboards] a "${eventName}" subscriber threw:`, error);
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

let flexiEventBusInstance: FlexiEventBus | undefined = undefined;

/**
 * Module-level singleton event bus. All events carry their board reference and
 * handlers filter on it, so a shared bus preserves multi-board isolation.
 * TODO(injection): consider constructor-injecting a per-board-tree bus instead,
 * decided alongside the adapter plumbing.
 */
export function getFlexiEventBus() {
	if (!flexiEventBusInstance) {
		flexiEventBusInstance = new FlexiEventBus();
	}

	return flexiEventBusInstance;
}
