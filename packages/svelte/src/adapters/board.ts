import { getContext, onDestroy, onMount, setContext } from 'svelte';
import {
	boardEvents,
	InternalFlexiBoardController,
	type FlexiBoardController,
	type FlexiBoardProps
} from '@flexiboards/core';
import { flexiEventBus } from './event-bus.js';
import {
	getInternalResponsiveFlexiboardCtx,
	hasInternalResponsiveFlexiboardCtx
} from './responsive.js';
import { reactive } from '../adapter.svelte.js';

const contextKey = Symbol('flexiboard');

export function flexiboard(props: FlexiBoardProps): InternalFlexiBoardController {
	// Create the event bus context for this board at the same time.
	flexiEventBus();

	// A board nested under a ResponsiveFlexiBoard registers against it.
	const responsiveParent = hasInternalResponsiveFlexiboardCtx()
		? getInternalResponsiveFlexiboardCtx()
		: null;

	const board = new InternalFlexiBoardController(props, responsiveParent);

	setContext(contextKey, board);

	// boardEvents attaches window listeners and returns its cleanup.
	onMount(() => boardEvents(board));
	onDestroy(() => board.destroy());

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
 * Gets the current {@link FlexiBoardController} instance, if any. Throws an error if no board is found.
 * @returns A {@link FlexiBoardController} instance.
 */
export function getFlexiboardCtx() {
	return reactive(getInternalFlexiboardCtx() as FlexiBoardController);
}
