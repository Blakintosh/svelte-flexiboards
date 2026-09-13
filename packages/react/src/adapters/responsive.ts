import {
	InternalResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardController
} from '@flexiboards/core';
import { createContext, useContext } from 'react';
import { useReactive } from './reactive.js';

/** @internal Provided by the ResponsiveFlexiBoard component; consumed via the hooks below. */
export const ResponsiveFlexiBoardContext =
	createContext<InternalResponsiveFlexiBoardController | null>(null);

/**
 * Gets the current {@link InternalResponsiveFlexiBoardController} instance, if any.
 * Returns null if no responsive board is found.
 * @internal
 */
export function useInternalResponsiveFlexiBoardOrNull(): InternalResponsiveFlexiBoardController | null {
	return useContext(ResponsiveFlexiBoardContext);
}

/**
 * Gets the current {@link InternalResponsiveFlexiBoardController} instance, if any.
 * Throws an error if no responsive board is found.
 * @internal
 */
export function useInternalResponsiveFlexiBoard(): InternalResponsiveFlexiBoardController {
	const board = useInternalResponsiveFlexiBoardOrNull();

	if (!board) {
		throw new Error(
			'Cannot get ResponsiveFlexiBoard context outside of a registered board. Ensure that <ResponsiveFlexiBoard> is rendered above this component.'
		);
	}

	return board;
}

/**
 * Gets the current {@link ResponsiveFlexiBoardController} instance, if any.
 * Throws an error if no responsive board is found.
 */
export function useResponsiveFlexiBoard(): ResponsiveFlexiBoardController {
	return useReactive(useInternalResponsiveFlexiBoard() as ResponsiveFlexiBoardController);
}
