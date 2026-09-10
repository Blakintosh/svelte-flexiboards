import type { FlexiBoardController } from '@flexiboards/core';
import { useMemo, type ReactNode } from 'react';
import type { FlexiCommonProps } from '../adapters/utils.js';
import type { FlexiBoardConfiguration, FlexiTargetPartialConfiguration } from '../types.js';
import { FlexiBoard } from './flexi-board.js';
import { FlexiTarget } from './flexi-target.js';

export type FlexiSortableProps = FlexiCommonProps<FlexiBoardController> & {
	/**
	 * Which way the list runs. Vertical is a column of rows, horizontal a row
	 * of columns.
	 * @default 'vertical'
	 */
	direction?: 'vertical' | 'horizontal';

	/**
	 * The target key, used when a layout is exported or imported.
	 * @default 'list'
	 */
	keyName?: string;

	/**
	 * Classes for the list's grid element (the place for `gap-*`).
	 */
	className?: string;

	/**
	 * Classes for the element wrapping the grid.
	 */
	containerClassName?: string;

	/**
	 * Classes for the board's root element.
	 */
	boardClassName?: string;

	/**
	 * Board configuration merged over the preset's defaults (widgets fully
	 * draggable). Anything a FlexiBoard accepts: callbacks, registry, layouts.
	 * Keep it referentially stable.
	 */
	config?: FlexiBoardConfiguration;

	/**
	 * Target configuration merged over the preset's. The layout is fixed by
	 * `direction`; sizing and widget defaults are yours to set.
	 */
	targetConfig?: Omit<FlexiTargetPartialConfiguration, 'layout'>;

	/**
	 * The list items: FlexiWidget declarations.
	 */
	children?: ReactNode;
};

/**
 * A sortable list: one flow target on one board. The first board someone
 * writes is three lines; the moment they need a second list, the same props
 * move onto FlexiBoard and FlexiTarget.
 */
export function FlexiSortable({
	direction = 'vertical',
	keyName = 'list',
	className,
	containerClassName,
	boardClassName,
	config,
	targetConfig,
	onfirstcreate,
	children
}: FlexiSortableProps) {
	const boardConfig = useMemo<FlexiBoardConfiguration>(
		() => ({ ...config, widgetDefaults: { draggability: 'full', ...config?.widgetDefaults } }),
		[config]
	);
	const listConfig = useMemo<FlexiTargetPartialConfiguration>(
		() => ({
			...targetConfig,
			layout:
				direction === 'vertical'
					? { type: 'flow', flowAxis: 'row', placementStrategy: 'append', columns: 1 }
					: { type: 'flow', flowAxis: 'column', placementStrategy: 'append', rows: 1 }
		}),
		[direction, targetConfig]
	);

	return (
		<FlexiBoard className={boardClassName} config={boardConfig} onfirstcreate={onfirstcreate}>
			<FlexiTarget
				keyName={keyName}
				className={className}
				containerClassName={containerClassName}
				config={listConfig}
			>
				{children}
			</FlexiTarget>
		</FlexiBoard>
	);
}
