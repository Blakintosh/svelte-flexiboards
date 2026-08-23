import type { FlexiGrid as FlexiGridPrimitive } from '@flexiboards/core';
import { createContext, useContext } from 'react';

/** @internal Provided by the FlexiGrid component; consumed via useFlexiGridOrNull. */
export const FlexiGridContext = createContext<FlexiGridPrimitive | null>(null);

export function useFlexiGridOrNull() {
	return useContext(FlexiGridContext);
}
