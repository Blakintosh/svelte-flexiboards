import type { InternalFlexiBoardController } from '../board/controller.js';
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
import { isSsrEnvironment } from './ssr.js';

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
	// A programmatic change (createWidget, moveTo, clear) that should count as a layout change
	'layout:changed': { board: InternalFlexiBoardController };
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
		// console.log('[event-bus] dispatching event', eventName, data);
		const eventListeners = this.listeners[eventName];

		if (!eventListeners) {
			return;
		}

		// Copy the array: handlers may subscribe or unsubscribe mid-dispatch.
		for (const listener of [...eventListeners]) {
			try {
				listener(data);
			} catch (error) {
				// Subscribers are independent. Release/cancel events drive cleanup
				// (returning portalled widgets, unlocking the viewport, clearing
				// action state), so one failure must not abort the rest and strand
				// the board. Contain and log instead of propagating.
				console.error(`[flexiboards] a "${eventName}" subscriber threw:`, error);
			}
		}
	}

	subscribe<K extends keyof EventMap>(
		eventName: K,
		listener: EventListener<EventMap[K]>
	): () => void {
		// The bus is a module-level singleton, but SSR never runs unmount hooks.
		// A subscription made while server-rendering would pin its whole
		// controller tree in memory for the server process's lifetime, and
		// events only fire from user interaction so it would never be called
		// anyway. Drop it.
		if (isSsrEnvironment()) {
			return () => {};
		}

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
 * Module-level singleton event bus. Events carry their board reference and
 * handlers filter on it, so a shared bus still keeps multi-board isolation.
 * TODO(injection): consider a per-board-tree bus injected via constructor,
 * decided alongside the adapter plumbing.
 */
export function getFlexiEventBus() {
	if (!flexiEventBusInstance) {
		flexiEventBusInstance = new FlexiEventBus();
	}

	return flexiEventBusInstance;
}
