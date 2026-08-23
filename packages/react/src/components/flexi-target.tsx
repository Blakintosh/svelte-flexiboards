import { type FlexiCommonProps, type FlexiTargetController, type FlexiTargetPartialConfiguration } from '@flexiboards/core';
import { useCallback, useEffect, type ReactNode } from 'react';
import { useInternalFlexiBoard } from '../adapters/board.js';
import { FlexiTargetContext } from '../adapters/target.js';
import { useOnce, useSingleRef } from '../adapters/utils.js';
import { useFromCore } from '../adapter.js';
import { RenderedFlexiWidget } from './rendered-flexi-widget.js';
import { FlexiGrid } from './flexi-grid.js';
import { FlexiTargetLoader } from './flexi-target-loader.js';

export type FlexiTargetProps = FlexiCommonProps<FlexiTargetController> & {
	/**
	 * The header content of the target, above the grid.
	 */
	header?: (params: { target: FlexiTargetController}) => ReactNode;

	/**
	 * The child content of the target, which should contain inner FlexiWidget
	 * definitions.
	 */
	children?: ReactNode;

	/**
	 * The footer content of the target, below the grid.
	 */
	footer?: (params: { target: FlexiTargetController}) => ReactNode;

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
	config?: FlexiTargetPartialConfiguration<string>;

	/**
	 * The unique identifier for the target.
	 * Used to identify the target when layouts are imported or exported.
	 */
	keyName?: string;
};

/**
 * Creates a new FlexiTarget in the context of the current FlexiBoard.
 */
export function FlexiTarget({ children, className, header, footer, config, containerClassName, keyName, onfirstcreate }: FlexiTargetProps) {
	const provider = useInternalFlexiBoard();
	const target = useSingleRef(() => provider.createTarget(config, keyName));

	useOnce(() => onfirstcreate?.(target as FlexiTargetController))

	// Prop seam — see FlexiBoard. Inert unless `config` actually changed.
	useEffect(() => {
		target.updateConfig(config);
	}, [target, config]);

	// Bridge core-signal reads into React's reactivity.
	const prepared = useFromCore(useCallback(() => target.prepared, [target]));
	const orderedWidgets = useFromCore(useCallback(() => target.orderedWidgets, [target]));
	const dropzoneWidget = useFromCore(useCallback(() => target.dropzoneWidget, [target]));
	const shouldRenderDropzoneWidget = useFromCore(useCallback(() => target.shouldRenderDropzoneWidget, [target]));

	return <FlexiTargetContext.Provider value={target}>
		<div className={containerClassName}>
			{header?.({ target: target as FlexiTargetController })}
			
			<FlexiGrid className={className}>
				{children && (
					<div style={prepared ? { visibility: 'hidden' } : {}}>
						{children}
					</div>
				)}

				{prepared && <>
					{orderedWidgets.map((widget) => (
						<RenderedFlexiWidget key={widget.id} widget={widget} />
					))}

					{dropzoneWidget && shouldRenderDropzoneWidget && (
						<RenderedFlexiWidget widget={dropzoneWidget} />
					)}
				</>}
			</FlexiGrid>

			{footer?.({ target: target as FlexiTargetController })}
		</div>

		<FlexiTargetLoader />
	</FlexiTargetContext.Provider>;
}
