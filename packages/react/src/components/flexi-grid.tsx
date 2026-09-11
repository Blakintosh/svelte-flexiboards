import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { FlexiGridContext } from '../adapters/grid.js';
import { useInternalFlexiTarget } from '../adapters/target.js';
import { controllerRef, useSingleRef } from '../adapters/utils.js';
import { parseStyleString, useFromCore } from '../adapter.js';

export type FlexiGridProps = {
	children?: ReactNode;
	className?: string;
};

/** @internal Rendered by FlexiTarget; owns the target's grid instance. */
export function FlexiGrid({ className, children }: FlexiGridProps) {
	const target = useInternalFlexiTarget();

	// A layout import can create the grid before this component renders. Reuse
	// it, or the widgets already placed in it are lost.
	const grid = useSingleRef(() => target.ensureGrid());

	const columns = useFromCore(useCallback(() => grid.columns, [grid]));
	const rows = useFromCore(useCallback(() => grid.rows, [grid]));
	const styleString = useFromCore(useCallback(() => grid.style, [grid]));
	const style = useMemo(() => parseStyleString(styleString), [styleString]);

	// watchGridElementDimensions returns its own cleanup, so hand it to the
	// effect.
	useEffect(() => grid.watchGridElementDimensions(), [grid]);

	return (
		<FlexiGridContext.Provider value={grid}>
			<div
				className={className}
				role="grid"
				aria-label="Drag-and-drop grid"
				aria-colcount={columns}
				aria-rowcount={rows}
				ref={controllerRef(grid)}
				style={style}
			>
				{children}
			</div>
		</FlexiGridContext.Provider>
	);
}
