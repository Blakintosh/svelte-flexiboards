import { InternalFlexiTargetController, type FlexiTargetController } from '@flexiboards/core';
import { createContext, useContext } from 'react';

/** @internal Provided by the FlexiTarget component; consumed via the hooks below. */
export const FlexiTargetContext = createContext<InternalFlexiTargetController | null>(null);

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
			'Cannot get FlexiTarget context outside of a registered target. Ensure that <FlexiTarget> is rendered within a <FlexiBoard> component.'
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
