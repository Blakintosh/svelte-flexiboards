import {
	type FlexiTargetController,
	InternalFlexiTargetController,
	type FlexiTargetPartialConfiguration
} from '@flexiboards/core';
import { useInternalFlexiBoard } from './board.js';
import { createContext, useContext, type ReactNode } from 'react';
import { useSingleRef } from './utils.js';

const FlexiTargetContext = createContext<InternalFlexiTargetController | null>(null);

export type FlexiTargetProps = {
    config?: FlexiTargetPartialConfiguration;
    children?: ReactNode;
    key?: string;   
}

/**
 * Creates a new {@link FlexiTargetController} instance in the context of the current FlexiBoard.
 * @returns A {@link FlexiTargetController} instance.
 */
export function FlexiTarget({ children, config, key }: FlexiTargetProps) {
	const provider = useInternalFlexiBoard();
	const target = useSingleRef(() => provider.createTarget(config, key));

	return (
        <FlexiTargetContext.Provider value={target}>
            {children}
        </FlexiTargetContext.Provider>
    )
}

/**
 * Gets the current {@link InternalFlexiTargetController} instance, if any. Returns null if no target is found.
 * @internal
 * @returns An {@link InternalFlexiTargetController} instance, or null.
 */
export function useInternalFlexiTargetOrNull() {
    return useContext(FlexiTargetContext);
}

/**
 * Gets the current {@link InternalFlexiTargetController} instance, if any. Throws an error if no target is found.
 * @internal
 * @returns An {@link InternalFlexiTargetController} instance.
 */
export function useInternalFlexiTarget() {
	const target = useInternalFlexiTargetOrNull();

	if (!target) {
		throw new Error(
			'Cannot get FlexiTarget context outside of a registered target. Ensure that flexitarget() (or <FlexiTarget>) is called within a <FlexiBoard> component.'
		);
	}

	return target;
}

/**
 * Gets the current {@link FlexiTargetController} instance, if any. Throws an error if no target is found.
 * @returns A {@link FlexiTargetController} instance.
 */
export function useFlexiTarget(): FlexiTargetController {
	return useInternalFlexiTarget() as FlexiTargetController;
}
