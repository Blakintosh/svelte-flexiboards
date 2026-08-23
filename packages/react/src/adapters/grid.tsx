import type { FlexiGrid as FlexiGridPrimitive } from '@flexiboards/core';
import { useInternalFlexiTarget } from './target.js';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useSingleRef } from './utils.js';

const FlexiGridContext = createContext<FlexiGridPrimitive | null>(null);

export type FlexiGridProps = {
    children?: ReactNode;
}

export function FlexiGrid({ children }: FlexiGridProps) {
	const target = useInternalFlexiTarget();

	const grid = useSingleRef(() => target.createGrid());

	// Tell the grid's dimension tracker to watch the grid element.
	useEffect(() => {
		grid.watchGridElementDimensions();
	}, []);

	return (
		<FlexiGridContext.Provider value={grid}>
            {children}
        </FlexiGridContext.Provider>
    );
}

export function useFlexiGridOrNull() {
	return useContext(FlexiGridContext);
}
