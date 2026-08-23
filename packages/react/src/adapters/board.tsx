import {
	boardEvents,
	InternalFlexiBoardController,
	type FlexiBoardController,
    type FlexiBoardProps as FlexiBoardPropsPrimitive
} from '@flexiboards/core';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useSingleRef } from './utils.js';
import { FlexiEventBus } from './event-bus.js';
import { useInternalResponsiveFlexiBoardOrNull } from './responsive.js';

export const FlexiBoardContext = createContext<InternalFlexiBoardController | null>(null);

export type FlexiBoardProps = FlexiBoardPropsPrimitive & {
    /**
     * The child content of the board, which should contain the inner
     * FlexiTarget and FlexiWidget components.
     */
    children?: ReactNode;
};

export function FlexiBoard({ children, ...props }: FlexiBoardProps) {
	// A board nested under a ResponsiveFlexiBoard registers against it.
	const responsiveParent = useInternalResponsiveFlexiBoardOrNull();

	const board = useSingleRef<InternalFlexiBoardController>(() => new InternalFlexiBoardController(props, responsiveParent));

	// boardEvents attaches window listeners and returns its cleanup.
	useEffect(() => boardEvents(board), []);

    return (
        // Wrap the event bus around to create it if it doesn't exist.
        <FlexiEventBus>
            <FlexiBoardContext.Provider value={board}>
                {children}
            </FlexiBoardContext.Provider>
        </FlexiEventBus>
    );
}

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
			'Cannot get FlexiBoard context outside of a registered board. Ensure that <FlexiBoard> is called.'
		);
	}

	return board;
}

/**
 * Gets the current {@link FlexiBoardController} instance, if any. Throws an error if no board is found.
 * @returns A {@link FlexiBoardController} instance.
 */
export function useFlexiBoard(): FlexiBoardController {
    return useInternalFlexiBoard() as FlexiBoardController;
}
