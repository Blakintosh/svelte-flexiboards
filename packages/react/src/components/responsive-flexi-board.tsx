import {
	InternalResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardProps as ResponsiveFlexiBoardPropsPrimitive
} from '@flexiboards/core';
import { Fragment, useCallback, useEffect, type ReactNode } from 'react';
import { ResponsiveFlexiBoardContext } from '../adapters/responsive.js';
import { useOnce, useSingleRef } from '../adapters/utils.js';
import { useFromCore } from '../adapter.js';

export type BreakpointSnippetParams = { currentBreakpoint: string };

export type ResponsiveFlexiBoardProps = ResponsiveFlexiBoardPropsPrimitive & {
	/**
	 * Production for large breakpoint (no params - breakpoint is implicit).
	 */
	lg?: ReactNode;

	/**
	 * Production for medium breakpoint (no params - breakpoint is implicit).
	 */
	md?: ReactNode;

	/**
	 * Production for small breakpoint (no params - breakpoint is implicit).
	 */
	sm?: ReactNode;
	/**
	 * 
	 * Production for extra-small breakpoint (no params - breakpoint is implicit).
	 */
	xs?: ReactNode;

	/**
	 * Children snippet used as fallback when no specific breakpoint snippet matches.
	 * Receives `{ currentBreakpoint: string }` as a parameter.
	 */
	children?: ( params: { currentBreakpoint: string }) => ReactNode;
};

export function ResponsiveFlexiBoard({
	lg,
	md,
	sm,
	xs,
	children,
	config,
	onfirstcreate
}: ResponsiveFlexiBoardProps) {
	const board = useSingleRef(() => {
		// Core's contract is just { config } — adapter-level props stay out.
		const b = new InternalResponsiveFlexiBoardController({ config });
		b.oninitialloadcomplete();

		return b;
	});

	useOnce(() => onfirstcreate?.(board as ResponsiveFlexiBoardController));

	const productions: Record<string, ReactNode | undefined> = { lg, md, sm, xs };

	const currentBreakpoint = useFromCore(useCallback(() => board.currentBreakpoint, [board]));
	const active = productions[currentBreakpoint];

	// Update props when board or config changes.
	useEffect(() => {
		board.updateProps({ config });
	}, [board, config]);

	return (
		<ResponsiveFlexiBoardContext.Provider value={board}>
			<Fragment key={currentBreakpoint}>
				{active !== undefined ? active : children?.({ currentBreakpoint })}
			</Fragment>
		</ResponsiveFlexiBoardContext.Provider>
	);
}
