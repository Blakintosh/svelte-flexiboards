import {
	FlexiDeleteController,
	InternalFlexiAddController,
	type FlexiAddController
} from '@flexiboards/core';
import { createContext, useContext } from 'react';
import { useReactive } from './reactive.js';

/** @internal Provided by the FlexiAdd component; consumed via the hooks below. */
export const FlexiAddContext = createContext<InternalFlexiAddController | null>(null);

/** @internal Provided by the FlexiDelete component. */
export const FlexiDeleteContext = createContext<FlexiDeleteController | null>(null);

export function useInternalFlexiAddOrNull() {
	return useContext(FlexiAddContext);
}

export function useInternalFlexiAdd() {
	const adder = useInternalFlexiAddOrNull();

	if (!adder) {
		throw new Error(
			'Cannot get FlexiAdd context outside of a registered adder. Ensure that <FlexiAdd> is rendered above this component.'
		);
	}

	return adder;
}

export function useFlexiAdd() {
	return useReactive(useInternalFlexiAdd() as FlexiAddController);
}
