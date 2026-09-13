import type { FlexiBoardController } from '@flexiboards/core';
import { useMemo, type ReactNode } from 'react';
import type { FlexiCommonProps } from '../adapters/utils.js';
import type { FlexiBoardConfiguration, FlexiTargetPartialConfiguration } from '../types.js';
import { FlexiBoard } from './flexi-board.js';
import { FlexiTarget } from './flexi-target.js';

export type FlexiDashboardProps = FlexiCommonProps<FlexiBoardController> & {
	/**
	 * Columns in the grid.
	 * @default 4
	 */
	columns?: number;

	/**
	 * Rows the grid starts with.
	 * @default 3
	 */
	rows?: number;

	/**
	 * Rows the grid may grow to as widgets are pushed down.
	 * @default rows
	 */
	maxRows?: number;

	/**
	 * Let widgets be resized from their FlexiResize handles.
	 * @default false
	 */
	resizable?: boolean;

	/**
	 * The target key, used when a layout is exported or imported.
	 * @default 'dashboard'
	 */
	keyName?: string;

	/**
	 * Classes for the grid element (the place for `gap-*`).
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
	 * Board configuration merged over the preset's defaults. Keep it
	 * referentially stable.
	 */
	config?: FlexiBoardConfiguration;

	/**
	 * Target configuration merged over the preset's. The layout comes from
	 * `columns`, `rows` and `maxRows`.
	 */
	targetConfig?: Omit<FlexiTargetPartialConfiguration, 'layout'>;

	/**
	 * The tiles: FlexiWidget declarations with `x`, `y`, `width`, `height`.
	 */
	children?: ReactNode;
};

/**
 * A dashboard: one free-form target on one board, with the min/max column
 * and row settings folded into `columns`, `rows` and `maxRows`.
 */
export function FlexiDashboard({
	columns = 4,
	rows = 3,
	maxRows,
	resizable = false,
	keyName = 'dashboard',
	className,
	containerClassName,
	boardClassName,
	config,
	targetConfig,
	onfirstcreate,
	children
}: FlexiDashboardProps) {
	const boardConfig = useMemo<FlexiBoardConfiguration>(
		() => ({
			...config,
			widgetDefaults: {
				draggability: 'full',
				resizability: resizable ? 'both' : 'none',
				...config?.widgetDefaults
			}
		}),
		[config, resizable]
	);
	const gridConfig = useMemo<FlexiTargetPartialConfiguration>(
		() => ({
			...targetConfig,
			layout: {
				type: 'free',
				minColumns: columns,
				maxColumns: columns,
				minRows: rows,
				maxRows: maxRows ?? rows
			}
		}),
		[columns, rows, maxRows, targetConfig]
	);

	return (
		<FlexiBoard className={boardClassName} config={boardConfig} onfirstcreate={onfirstcreate}>
			<FlexiTarget
				keyName={keyName}
				className={className}
				containerClassName={containerClassName}
				config={gridConfig}
			>
				{children}
			</FlexiTarget>
		</FlexiBoard>
	);
}
