import { getContext, setContext } from 'svelte';
import type { ResponsiveFlexiBoardController } from './base.svelte.js';
import { InternalResponsiveFlexiBoardController } from './controller.svelte.js';
import type { ResponsiveFlexiBoardProps } from '$lib/components/responsive-flexi-board.svelte';
import type { ResponsiveFlexiBoardConfiguration, ResponsiveFlexiLayout } from './types.js';

const contextKey = Symbol('responsive-flexiboard');

export function responsiveflexiboard(
	props: ResponsiveFlexiBoardProps
): InternalResponsiveFlexiBoardController {
	const board = new InternalResponsiveFlexiBoardController(props);
	setContext(contextKey, board);
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
	return getInternalResponsiveFlexiboardCtx() as ResponsiveFlexiBoardController;
}

/* Exports to go to root index.ts */
export {
	type ResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardConfiguration,
	type ResponsiveFlexiLayout
};
