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

	const grid = useSingleRef(() => target.createGrid());

	const columns = useFromCore(useCallback(() => grid.columns, [grid]));
	const rows = useFromCore(useCallback(() => grid.rows, [grid]));
	const styleString = useFromCore(useCallback(() => grid.style, [grid]));
	const style = useMemo(() => parseStyleString(styleString), [styleString]);

	// Tell the grid's dimension tracker to watch the grid element.
	useEffect(() => {
		grid.watchGridElementDimensions();
	}, [grid]);

	return <FlexiGridContext.Provider value={grid}>
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
	</FlexiGridContext.Provider>;
}
