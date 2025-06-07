import { getContext, setContext } from 'svelte';
import type { FlexiBoardController } from './base.svelte.js';
import { InternalFlexiBoardController } from './controller.svelte.js';
import type { FlexiBoardProps } from '$lib/components/flexi-board.svelte';

const contextKey = Symbol('flexiboard');

export function flexiboard(props: FlexiBoardProps): InternalFlexiBoardController {
	const board = new InternalFlexiBoardController(props);

	setContext(contextKey, board);
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
