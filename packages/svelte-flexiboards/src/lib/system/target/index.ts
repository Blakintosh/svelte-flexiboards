import { getContext, setContext } from 'svelte';
import type { FlexiTargetController } from './base.svelte.js';
import type { InternalFlexiTargetController } from './controller.svelte.js';
import type { FlexiTargetConfiguration, FlexiTargetPartialConfiguration } from './types.js';
import { getInternalFlexiboardCtx } from '../board/index.js';

const contextKey = Symbol('flexitarget');

/**
 * Creates a new {@link FlexiTargetController} instance in the context of the current FlexiBoard.
 * @returns A {@link FlexiTargetController} instance.
 */
export function flexitarget(config?: FlexiTargetPartialConfiguration, key?: string) {
	const provider = getInternalFlexiboardCtx();
	const target = provider.createTarget(config, key);

	setContext(contextKey, target);

	return {
		target: target as FlexiTargetController
	};
}

/**
 * Gets the current {@link InternalFlexiTargetController} instance, if any. Throws an error if no target is found.
 * @internal
 * @returns An {@link InternalFlexiTargetController} instance.
 */
export function getInternalFlexitargetCtx() {
	const target = getContext<InternalFlexiTargetController | undefined>(contextKey);

	// No provider to attach to.
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
export function getFlexitargetCtx() {
	return getInternalFlexitargetCtx() as FlexiTargetController;
}

/* Exports to go to root index.ts */
export { type FlexiTargetConfiguration, type FlexiTargetController };
