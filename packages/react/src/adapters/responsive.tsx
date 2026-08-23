import {
	InternalResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardProps as ResponsiveFlexiBoardPropsPrimitive
} from '@flexiboards/core';
import { createContext, useContext, type ReactNode } from 'react';
import { useSingleRef } from './utils.js';

const ResponsiveFlexiBoardContext = createContext<InternalResponsiveFlexiBoardController | null>(null);

export type ResponsiveFlexiBoardProps = ResponsiveFlexiBoardPropsPrimitive & {
    children: ReactNode;
}

export function ResponsiveFlexiBoard({ children, ...props }: ResponsiveFlexiBoardProps) {
	const board = useSingleRef(() => new InternalResponsiveFlexiBoardController(props));

	return (
        <ResponsiveFlexiBoardContext.Provider value={board}>
            {children}
        </ResponsiveFlexiBoardContext.Provider>
    );
}

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
			'Cannot get ResponsiveFlexiBoard context outside of a registered board. Ensure that <ResponsiveFlexiBoard> is called.'
		);
	}

	return board;
}

/**
 * Gets the current {@link ResponsiveFlexiBoardController} instance, if any.
 * Throws an error if no responsive board is found.
 */
export function useResponsiveFlexiBoard(): ResponsiveFlexiBoardController {
	return useInternalResponsiveFlexiBoard() as ResponsiveFlexiBoardController;
}
