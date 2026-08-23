import { type FlexiEventBus as FlexiEventBusPrimitive } from '@flexiboards/core';
import { createContext, useContext } from 'react';

/** @internal Provided by FlexiEventBusProvider; consumed via useFlexiEventBus. */
export const FlexiEventBusContext = createContext<FlexiEventBusPrimitive | null>(null);

export function useFlexiEventBusOrNull(): FlexiEventBusPrimitive | null {
	return useContext(FlexiEventBusContext);
}

export function useFlexiEventBus(): FlexiEventBusPrimitive {
	const eventBus = useFlexiEventBusOrNull();

	if (!eventBus) {
		throw new Error(
			'Cannot get FlexiEventBus context outside of a registered event bus. Ensure that <FlexiBoard> (or FlexiEventBusProvider) is rendered above this component.'
		);
	}

	return eventBus;
}
