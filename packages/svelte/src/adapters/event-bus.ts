import { getFlexiEventBus, type FlexiEventBus } from '@flexiboards/core';
import { getContext, setContext } from 'svelte';

const contextKey = Symbol('flexieventbus');

export function flexiEventBus(): FlexiEventBus {
	// Distribute core's bus — the instance the controllers subscribe on. Creating a
	// separate instance here would split adapter dispatches from core's listeners.
	const eventBus = getFlexiEventBus();

	setContext(contextKey, eventBus);
	return eventBus;
}

export function getFlexiEventBusCtx(): FlexiEventBus {
	const eventBus = getContext<FlexiEventBus | undefined>(contextKey);

	if (!eventBus) {
		throw new Error(
			'Cannot get FlexiEventBus context outside of a registered event bus. Ensure that flexiEventBus() is called.'
		);
	}

	return eventBus;
}
