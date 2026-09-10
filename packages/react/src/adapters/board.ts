import { InternalFlexiBoardController, type FlexiBoardController } from '@flexiboards/core';
import { createContext, useContext } from 'react';
import { useReactive } from './reactive.js';

/** @internal Provided by the FlexiBoard component; consumed via the hooks below. */
export const FlexiBoardContext = createContext<InternalFlexiBoardController | null>(null);

/**
 * Gets the current {@link InternalFlexiBoardController} instance, if any. Returns null if no board is found.
 * @internal
 * @returns An {@link InternalFlexiBoardController} instance or null.
 */
export function useInternalFlexiBoardOrNull() {
	return useContext(FlexiBoardContext);
}

/**
 * Gets the current {@link InternalFlexiBoardController} instance, if any. Throws an error if no board is found.
 * @internal
 * @returns An {@link InternalFlexiBoardController} instance.
 */
export function useInternalFlexiBoard() {
	const board = useInternalFlexiBoardOrNull();

	// No provider to attach to.
	if (!board) {
		throw new Error(
			'Cannot get FlexiBoard context outside of a registered board. Ensure that <FlexiBoard> is rendered above this component.'
		);
	}

	return board;
}

/**
 * Gets the current {@link FlexiBoardController} instance, if any. Throws an error if no board is found.
 * @returns A {@link FlexiBoardController} instance.
 */
export function useFlexiBoard(): FlexiBoardController {
	return useReactive(useInternalFlexiBoard() as FlexiBoardController);
}
