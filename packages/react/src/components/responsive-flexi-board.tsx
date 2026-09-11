import {
	InternalResponsiveFlexiBoardController,
	markSsrEnvironment,
	type ResponsiveFlexiBoardController,
	type ResponsiveFlexiBoardProps as ResponsiveFlexiBoardPropsPrimitive
} from '@flexiboards/core';
import { Fragment, useCallback, useEffect, type ReactNode } from 'react';
import { ResponsiveFlexiBoardContext } from '../adapters/responsive.js';
import {
	renderChildren,
	useClientLayoutEffect,
	useOnceCommitted,
	useSingleRef,
	type FlexiChildren,
	type FlexiCommonProps
} from '../adapters/utils.js';
import { useFromCore } from '../adapter.js';

export type BreakpointSnippetParams = { currentBreakpoint: string };

export type ResponsiveFlexiBoardProps = Omit<ResponsiveFlexiBoardPropsPrimitive, 'controller'> &
	FlexiCommonProps<ResponsiveFlexiBoardController> & {
		/**
		 * Content rendered at the large breakpoint.
		 */
		lg?: ReactNode;

		/**
		 * Content rendered at the medium breakpoint.
		 */
		md?: ReactNode;

		/**
		 * Content rendered at the small breakpoint.
		 */
		sm?: ReactNode;
		/**
		 * Content rendered at the extra-small breakpoint.
		 */
		xs?: ReactNode;

		/**
		 * Fallback content used when no breakpoint-specific content matches.
		 * Receives `{ currentBreakpoint: string }`.
		 */
		children?: FlexiChildren<{ currentBreakpoint: string }>;
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
		if (typeof window === 'undefined') markSsrEnvironment();
		return new InternalResponsiveFlexiBoardController({ config }, true);
	});

	// Hydrate the assumed breakpoint first. Resolve viewport/storage before
	// paint, with client layout imports queued until the child boards are ready.
	useClientLayoutEffect(() => board.oninitialloadcomplete(), [board]);

	useOnceCommitted(() => onfirstcreate?.(board as ResponsiveFlexiBoardController));

	const productions: Record<string, ReactNode | undefined> = { lg, md, sm, xs };

	const currentBreakpoint = useFromCore(useCallback(() => board.currentBreakpoint, [board]));
	const active = productions[currentBreakpoint];

	// Prop seam, see FlexiBoard. Runs every render, inert unless `config`
	// differs by value.
	useEffect(() => {
		board.updateProps({ config });
	});

	return (
		<ResponsiveFlexiBoardContext.Provider value={board}>
			<Fragment key={currentBreakpoint}>
				{active !== undefined ? active : renderChildren(children, { currentBreakpoint })}
			</Fragment>
		</ResponsiveFlexiBoardContext.Provider>
	);
}
