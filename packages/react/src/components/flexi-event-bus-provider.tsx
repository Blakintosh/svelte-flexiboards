import { getFlexiEventBus } from '@flexiboards/core';
import { type ReactNode } from 'react';
import { FlexiEventBusContext } from '../adapters/event-bus.js';

export type FlexiEventBusProviderProps = {
	/**
	 * The child content of the event bus provider.
	 */
	children?: ReactNode;
};

/** @internal Rendered by FlexiBoard; distributes core's event bus via context. */
export function FlexiEventBusProvider({ children }: FlexiEventBusProviderProps) {
	// Distribute core's bus — the instance the controllers subscribe on. Creating a
	// separate instance here would split adapter dispatches from core's listeners.
	// getFlexiEventBus() is an idempotent read of core's module singleton, so
	// calling it during render is safe.
	const eventBus = getFlexiEventBus();

	return (
		<FlexiEventBusContext.Provider value={eventBus}>{children}</FlexiEventBusContext.Provider>
	);
}
