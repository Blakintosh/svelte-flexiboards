import { type FlexiTargetController } from '@flexiboards/core';
import type { FlexiTargetPartialConfiguration } from '../types.js';
import { useCallback, useEffect, type ReactNode } from 'react';
import { useInternalFlexiBoard } from '../adapters/board.js';
import { FlexiTargetContext } from '../adapters/target.js';
import {
	renderChildren,
	useOnceCommitted,
	useSingleRef,
	type FlexiChildren,
	type FlexiCommonProps
} from '../adapters/utils.js';
import { useFromCore } from '../adapter.js';
import { useReactive } from '../adapters/reactive.js';
import { RenderedFlexiWidget } from './rendered-flexi-widget.js';
import { FlexiGrid } from './flexi-grid.js';
import { FlexiTargetLoader } from './flexi-target-loader.js';

export type FlexiTargetProps = FlexiCommonProps<FlexiTargetController> & {
	/**
	 * The header content of the target, above the grid.
	 */
	header?: FlexiChildren<{ target: FlexiTargetController }>;

	/**
	 * The child content of the target, which should contain inner FlexiWidget
	 * definitions.
	 */
	children?: ReactNode;

	/**
	 * The footer content of the target, below the grid.
	 */
	footer?: FlexiChildren<{ target: FlexiTargetController }>;

	/**
	 * The class names to apply to the target's container element.
	 */
	containerClassName?: string;

	/**
	 * The class names to apply to the target's grid element.
	 */
	className?: string;

	/**
	 * The configuration object for the target.
	 */
	config?: FlexiTargetPartialConfiguration;

	/**
	 * The unique identifier for the target.
	 * Used to identify the target when layouts are imported or exported.
	 */
	keyName?: string;
};

/**
 * Creates a new FlexiTarget in the context of the current FlexiBoard.
 */
export function FlexiTarget({
	children,
	className,
	header,
	footer,
	config,
	containerClassName,
	keyName,
	onfirstcreate
}: FlexiTargetProps) {
	const provider = useInternalFlexiBoard();
	const target = useSingleRef(() => provider.createTarget(config, keyName));

	useOnceCommitted(() => onfirstcreate?.(target as FlexiTargetController));

	// Prop seam — see FlexiBoard. Runs every render; inert unless `config`
	// differs by value.
	useEffect(() => {
		target.updateConfig(config);
	});

	// Consumer-facing handle for the header/footer render functions.
	const publicTarget = useReactive(target as FlexiTargetController);

	// Bridge core-signal reads into React's reactivity.
	const prepared = useFromCore(useCallback(() => target.prepared, [target]));
	const orderedWidgets = useFromCore(useCallback(() => target.orderedWidgets, [target]));
	const dropzoneWidget = useFromCore(useCallback(() => target.dropzoneWidget, [target]));
	const shouldRenderDropzoneWidget = useFromCore(
		useCallback(() => target.shouldRenderDropzoneWidget, [target])
	);

	return (
		<FlexiTargetContext.Provider value={target}>
			<div className={containerClassName}>
				{renderChildren(header, { target: publicTarget })}

				<FlexiGrid className={className}>
					{children && (
						// The FlexiWidget declarations in here register their configs and
						// render no markup, so the wrapper is inert. display:none (not
						// visibility) so it never occupies a grid cell of its own.
						<div style={{ display: 'none' }}>{children}</div>
					)}

					{prepared && (
						<>
							{orderedWidgets.map((widget) => (
								<RenderedFlexiWidget key={widget.id} widget={widget} />
							))}

							{dropzoneWidget && shouldRenderDropzoneWidget && (
								<RenderedFlexiWidget widget={dropzoneWidget} />
							)}
						</>
					)}
				</FlexiGrid>

				{renderChildren(footer, { target: publicTarget })}
			</div>

			{/* Creates the registered widgets at render time, in this same render
		    pass: after the children (registrations happen inside the grid's
		    subtree, which React renders first) and before the board's own
		    loader (a later sibling of every target), so stored layouts replace
		    the declared widgets rather than stacking on top of them — the
		    Svelte init ordering. The grid read orderedWidgets before this ran;
		    useSyncExternalStore re-checks its snapshot on subscribe, so it
		    re-renders with the created widgets. */}
			<FlexiTargetLoader />
		</FlexiTargetContext.Provider>
	);
}
