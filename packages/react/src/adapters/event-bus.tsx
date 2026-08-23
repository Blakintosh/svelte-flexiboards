import { getFlexiEventBus, type FlexiEventBus as FlexiEventBusPrimitive } from '@flexiboards/core';
import { createContext, useContext, type ReactNode } from 'react';

export const FlexiEventBusContext = createContext<FlexiEventBusPrimitive | null>(null);

export type FlexiEventBusProps = {
    /**
     * The child content of the event bus provider.
     */
    children?: ReactNode;
} 

export function FlexiEventBus({ children }: FlexiEventBusProps) {
	// Distribute core's bus — the instance the controllers subscribe on. Creating a
	// separate instance here would split adapter dispatches from core's listeners.
	const eventBus = getFlexiEventBus();

    return (
        <FlexiEventBusContext.Provider value={eventBus}>
            {children}
        </FlexiEventBusContext.Provider>
    );
}

export function useFlexiEventBusOrNull(): FlexiEventBusPrimitive | null {
	return useContext(FlexiEventBusContext);
}


export function useFlexiEventBus(): FlexiEventBusPrimitive {
    const eventBus = useFlexiEventBusOrNull();

	if (!eventBus) {
		throw new Error(
			'Cannot get FlexiEventBus context outside of a registered event bus. Ensure that FlexiEventBus is created.'
		);
	}

	return eventBus;
}
