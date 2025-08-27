import { getContext, setContext } from 'svelte';
import type { FlexiBoardController } from './base.svelte.js';
import { InternalFlexiBoardController } from './controller.svelte.js';
import type { FlexiBoardProps } from '$lib/components/flexi-board.svelte';
import { flexiEventBus } from '../shared/event-bus.js';
import type { FlexiBoardConfiguration } from './types.js';
import { boardEvents } from './events.js';

const contextKey = Symbol('flexiboard');

export function flexiboard(props: FlexiBoardProps): InternalFlexiBoardController {
	// Create the event bus context for this board at the same time.
	const eventBus = flexiEventBus();

	const board = new InternalFlexiBoardController(props);

	setContext(contextKey, board);
	boardEvents(board);

	return board;
}

/**
 * Gets the current {@link InternalFlexiBoardController} instance, if any. Throws an error if no board is found.
 * @internal
 * @returns An {@link InternalFlexiBoardController} instance.
 */
export function getInternalFlexiboardCtx() {
	const board = getContext<InternalFlexiBoardController | undefined>(contextKey);

	// No provider to attach to.
	if (!board) {
		throw new Error(
			'Cannot get FlexiBoard context outside of a registered board. Ensure that flexiboard() (or <FlexiBoard>) is called.'
		);
	}

	return board;
}

/**
 * Gets the current {@link FlexiBoard} instance, if any. Throws an error if no board is found.
 * @internal
 * @returns A {@link FlexiBoard} instance.
 */
export function getFlexiboardCtx() {
	return getInternalFlexiboardCtx() as FlexiBoardController;
}

/* Exports to go to root index.ts */
export { type FlexiBoardController, type FlexiBoardConfiguration };
