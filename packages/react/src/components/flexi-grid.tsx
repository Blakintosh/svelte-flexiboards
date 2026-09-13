import { assistiveTextStyleObject } from '@flexiboards/core';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { FlexiGridContext } from '../adapters/grid.js';
import { useInternalFlexiTarget } from '../adapters/target.js';
import { controllerRef, useSingleRef } from '../adapters/utils.js';
import { parseStyleString, useFromCore } from '../adapter.js';

export type FlexiGridProps = {
	children?: ReactNode;
	accessibilityId: string;
	className?: string;
};

/** @internal Rendered by FlexiTarget; owns the target's grid instance. */
export function FlexiGrid({ className, children, accessibilityId }: FlexiGridProps) {
	const target = useInternalFlexiTarget();

	// A layout import can create the grid before this component renders. Reuse
	// it, or the widgets already placed in it are lost.
	const grid = useSingleRef(() => target.ensureGrid());

	const accessibilityRows = useFromCore(useCallback(() => target.accessibilityRows, [target]));
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
				data-flexi-grid=""
				aria-label="Drag-and-drop grid"
				aria-colcount={Math.max(1, columns)}
				aria-rowcount={Math.max(1, rows)}
				ref={controllerRef(grid)}
				style={style}
			>
				{/* aria-owns groups cells without remounting them on row changes or drop flights. */}
				{accessibilityRows.map((row) => (
					<div
						key={row.index}
						role="row"
						aria-rowindex={row.index}
						aria-owns={row.cells.map((index) => `${accessibilityId}-cell-${index}`).join(' ')}
						style={{ position: 'absolute', width: 1, height: 1, pointerEvents: 'none' }}
					/>
				))}
				{accessibilityRows.length === 0 && (
					<div role="row" aria-rowindex={1} style={{ display: 'contents' }}>
						<div role="gridcell" aria-colindex={1} style={assistiveTextStyleObject}>
							Empty drop target
						</div>
					</div>
				)}
				{children}
			</div>
		</FlexiGridContext.Provider>
	);
}
