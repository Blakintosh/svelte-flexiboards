import { getContext, onDestroy, setContext } from 'svelte';
import {
	InternalResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardProps
} from '@flexiboards/core';
import { reactive } from '../adapter.svelte.js';

const contextKey = Symbol('responsive-flexiboard');

export function responsiveflexiboard(
	props: ResponsiveFlexiBoardProps
): InternalResponsiveFlexiBoardController {
	const board = new InternalResponsiveFlexiBoardController(props);

	setContext(contextKey, board);
	onDestroy(() => board.destroy());

	return board;
}

/**
 * Gets the current {@link InternalResponsiveFlexiBoardController} instance, if any.
 * Throws an error if no responsive board is found.
 * @internal
 */
export function getInternalResponsiveFlexiboardCtx(): InternalResponsiveFlexiBoardController {
	const board = getContext<InternalResponsiveFlexiBoardController | undefined>(contextKey);

	if (!board) {
		throw new Error(
			'Cannot get ResponsiveFlexiBoard context outside of a registered board. Ensure that responsiveflexiboard() (or <ResponsiveFlexiBoard>) is called.'
		);
	}

	return board;
}

/**
 * Checks if a responsive board context is available.
 * @returns Whether a responsive board context is available.
 */
export function hasInternalResponsiveFlexiboardCtx(): boolean {
	return !!getContext<InternalResponsiveFlexiBoardController | undefined>(contextKey);
}

/**
 * Gets the current {@link ResponsiveFlexiBoardController} instance, if any.
 * Throws an error if no responsive board is found.
 */
export function getResponsiveFlexiboardCtx(): ResponsiveFlexiBoardController {
	return reactive(getInternalResponsiveFlexiboardCtx() as ResponsiveFlexiBoardController);
}
