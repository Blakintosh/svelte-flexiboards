import type { FlexiTargetConfiguration, InternalFlexiTargetController } from '../target.svelte.js';
import type { FlexiWidgetController } from '../widget.svelte.js';
import { FlexiGrid, type MoveOperation, type WidgetSnapshot } from './base.svelte.js';

const MAX_COLUMNS = 32;

/**
 * Free-form Flexigrid Layout
 *
 * A grid layout where widgets are explicitly placed in particular cells, and the grid allows for gaps between widgets.
 * A free grid can grow and shrink if required when enabled.
 */
export class FreeFormFlexiGrid extends FlexiGrid {
	#widgets: Set<FlexiWidgetController> = new Set();

	#targetConfig: FlexiTargetConfiguration = $state() as FlexiTargetConfiguration;
	#rawLayoutConfig: FreeFormTargetLayout = $derived(
		this.#targetConfig.layout
	) as FreeFormTargetLayout;

	#layoutConfig: DerivedFreeFormTargetLayout = $derived({
		type: 'free',
		// v0.3: Remove baseRows and baseColumns
		minColumns: this.#rawLayoutConfig?.minColumns ?? this.#targetConfig.baseColumns ?? 1,
		minRows: this.#rawLayoutConfig?.minRows ?? this.#targetConfig.baseRows ?? 1,
		maxColumns: this.#rawLayoutConfig?.maxColumns ?? Infinity,
		maxRows: this.#rawLayoutConfig?.maxRows ?? Infinity,

		// Deprecated, remove in v0.3
		expandColumns: this.#rawLayoutConfig?.expandColumns ?? true,
		expandRows: this.#rawLayoutConfig?.expandRows ?? true
	});

	#rows: number = $state() as number;
	#columns: number = $state() as number;

	#coordinateSystem: FreeFormGridCoordinateSystem = $state() as FreeFormGridCoordinateSystem;

	constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
		super(target, targetConfig);

		this.#targetConfig = targetConfig;

		// $deriveds haven't run by this point, so we need to access the config directly.
		const layout = targetConfig.layout as FreeFormTargetLayout;

		// v0.3: Remove baseRows and baseColumns
		this.#rows = layout.minRows ?? targetConfig.baseRows ?? 1;
		this.#columns = layout.minColumns ?? targetConfig.baseColumns ?? 1;

		this.#coordinateSystem = new FreeFormGridCoordinateSystem(this);
	}

	tryPlaceWidget(
		widget: FlexiWidgetController,
		inputX?: number,
		inputY?: number,
		inputWidth?: number,
		inputHeight?: number
	): boolean {
		let [x, y, width, height] = this.#normalisePlacementDimensions(
			inputX,
			inputY,
			inputWidth,
			inputHeight
		);

		// We need to try expand the grid if the widget is moving beyond the current bounds,
		// but if this is not possible then the operation fails.
		if (!this.expandIfNeededToFit(x, y, width, height)) {
			return false;
		}

		// Get proposed operations up-front, so we can cancel if needed.
		const operations: Map<FlexiWidgetController, MoveOperation> = new Map();

		// Try to resolve any collisions, if not possible then the operation fails.
		if (!this.#resolveCollisions({ widget, x, y, width, height }, operations)) {
			return false;
		}

		// Apply the moves.
		for (const operation of operations.values()) {
			this.#doMoveOperation(operation.widget, operation);
		}

		// Place the widget now that all other widgets have been moved out of the way.
		this.#coordinateSystem.addWidget(widget, x, y, width, height);
		widget.setBounds(x, y, width, height);
		this.#widgets.add(widget);
		return true;
	}

	#resolveCollisions(
		move: CollisionCheck,
		operations: Map<FlexiWidgetController, MoveOperation>,
		displaceX: boolean = true,
		displaceY: boolean = true
	): boolean {
		const { x: newX, y: newY, width, height } = move;

		// We need to try expand the grid if the widget is moving beyond the current bounds,
		// but if this is not possible then the operation fails.
		if (!this.expandIfNeededToFit(newX, newY, width, height)) {
			return false;
		}

		// Looking row-by-row, we can identify collisions using the bitmaps.
		for (let i = newY; i < newY + height; i++) {
			for (let j = newX; j < newX + width; j++) {
				// Find the first column that a collision occurs on this row, if any.
				const collidingWidget = this.#coordinateSystem.getCollidingWidgetIfAny(j, i);

				// No collision, all good.
				if (!collidingWidget) {
					continue;
				}

				if (!collidingWidget.draggable) {
					return false;
				}

				// Before relocating the colliding widget, remove it from the coordinate system so it can't collide with itself.
				this.#coordinateSystem.removeWidget(collidingWidget);

				// Try move the colliding widget along the x-axis if this is allowed and possible.
				const xMove =
					displaceX &&
					this.#resolveCollisions(
						{
							widget: collidingWidget,
							x: newX + width,
							y: collidingWidget.y,
							width: collidingWidget.width,
							height: collidingWidget.height
						},
						operations,
						displaceX,
						false
					);

				if (xMove) {
					operations.set(collidingWidget, {
						widget: collidingWidget,
						newX: newX + width,
						newY: collidingWidget.y,
						oldX: collidingWidget.x,
						oldY: collidingWidget.y
					});
					// this is a bit hacky but we need to add the widget back to the coordinate system in case the move doesn't happen.
					this.#coordinateSystem.addWidget(
						collidingWidget,
						collidingWidget.x,
						collidingWidget.y,
						collidingWidget.width,
						collidingWidget.height
					);
					continue;
				}

				// If the x-axis move failed, try move the colliding widget along the y-axis if this is allowed and possible.
				const yMove =
					displaceY &&
					this.#resolveCollisions(
						{
							widget: collidingWidget,
							x: collidingWidget.x,
							y: newY + height,
							width: collidingWidget.width,
							height: collidingWidget.height
						},
						operations,
						false,
						displaceY
					);

				if (yMove) {
					operations.set(collidingWidget, {
						widget: collidingWidget,
						newX: collidingWidget.x,
						newY: newY + height,
						oldX: collidingWidget.x,
						oldY: collidingWidget.y
					});
					// this is a bit hacky but we need to add the widget back to the coordinate system in case the move doesn't happen.
					this.#coordinateSystem.addWidget(
						collidingWidget,
						collidingWidget.x,
						collidingWidget.y,
						collidingWidget.width,
						collidingWidget.height
					);
					continue;
				}

				// Neither worked, we can't move the widget.
				// this is a bit hacky but we need to add the widget back to the coordinate system in case the move doesn't happen.
				this.#coordinateSystem.addWidget(
					collidingWidget,
					collidingWidget.x,
					collidingWidget.y,
					collidingWidget.width,
					collidingWidget.height
				);
				return false;
			}
		}
		return true;
	}

	removeWidget(widget: FlexiWidgetController): boolean {
		// Delete it from the grid, incl the coordinate system.
		this.#widgets.delete(widget);
		this.#coordinateSystem.removeWidget(widget);

		// If we now have empty rows or columns at the ends, remove them.
		// this.#removeTrailingEmptyRows();
		// this.#removeTrailingEmptyColumns();

		return true;
	}

	takeSnapshot(): FreeFormGridSnapshot {
		return {
			layout: this.#coordinateSystem.layout.map((row) => [...row]),
			bitmaps: [...this.#coordinateSystem.bitmaps],
			rows: this.#rows,
			columns: this.#columns,
			widgets: Array.from(this.#widgets).map((widget) => ({
				widget,
				x: widget.x,
				y: widget.y,
				width: widget.width,
				height: widget.height
			}))
		};
	}

	clear() {
		this.#widgets.clear();

		this.#coordinateSystem.updateForRows(this.#rows, this.#layoutConfig.minRows);
		this.#coordinateSystem.updateForColumns(this.#columns, this.#layoutConfig.minColumns);

		this.#rows = this.#layoutConfig.minRows;
		this.#columns = this.#layoutConfig.minColumns;

		this.#coordinateSystem.clear();
	}

	restoreFromSnapshot(snapshot: FreeFormGridSnapshot) {
		// Must deep copy these again, as the snapshot may be re-used.
		this.#coordinateSystem.bitmaps = [...snapshot.bitmaps];
		this.#coordinateSystem.layout = snapshot.layout.map((row) => [...row]);

		this.#coordinateSystem.updateForRows(this.#rows, snapshot.rows);
		this.#coordinateSystem.updateForColumns(this.#columns, snapshot.columns);

		this.#rows = snapshot.rows;
		this.#columns = snapshot.columns;

		this.#widgets.clear();
		for (const widget of snapshot.widgets) {
			this.#widgets.add(widget.widget);
			widget.widget.setBounds(widget.x, widget.y, widget.width, widget.height);
		}
	}

	mapRawCellToFinalCell(x: number, y: number): [number, number] {
		return [Math.floor(x), Math.floor(y)];
	}

	#normalisePlacementDimensions(x?: number, y?: number, width?: number, height?: number) {
		if (x === undefined || y === undefined) {
			throw new Error(
				'Missing required x and y fields for a widget in a sparse target layout. The x- and y- coordinates of a widget cannot be automatically inferred in this context.'
			);
		}

		// Make sure the widget can only expand the grid relative from its current dimensions.
		if (x >= this.#columns) {
			x = this.#columns - 1;
		}
		if (y >= this.#rows) {
			y = this.#rows - 1;
		}

		return [x, y, width ?? 1, height ?? 1];
	}

	#doMoveOperation(widget: FlexiWidgetController, operation: MoveOperation) {
		// TODO: Not sure yet whether we should be cleaning up a moved widget, we'll see.
		// Pretty sure the thing that'll occupy its space always comes after, so this operation
		// should be safe.
		this.#coordinateSystem.removeWidget(widget);

		// Place the widget in the new position.
		this.#coordinateSystem.addWidget(
			widget,
			operation.newX,
			operation.newY,
			widget.width,
			widget.height
		);
		widget.setBounds(operation.newX, operation.newY, widget.width, widget.height);
	}

	expandIfNeededToFit(x: number, y: number, width: number, height: number) {
		if (x + width > this.#columns && !this.#tryExpandColumns(x + width)) {
			return false;
		}
		if (y + height > this.#rows && !this.#tryExpandRows(y + height)) {
			return false;
		}
		return true;
	}

	#tryExpandColumns(count: number) {
		if (count > Math.min(this.#layoutConfig.maxColumns, MAX_COLUMNS)) {
			return false;
		}

		this.#setColumns(count);

		return true;
	}

	#tryExpandRows(count: number) {
		if (count > this.#layoutConfig.maxRows) {
			return false;
		}

		this.#setRows(count);

		return true;
	}

	#setRows(value: number) {
		this.#coordinateSystem.updateForRows(this.#rows, value);
		this.#rows = value;
	}

	#setColumns(value: number) {
		this.#coordinateSystem.updateForColumns(this.#columns, value);
		this.#columns = value;
	}

	// Getters and setters

	get rows() {
		return this.#rows;
	}

	get columns() {
		return this.#columns;
	}
}

class FreeFormGridCoordinateSystem {
	#grid: FreeFormFlexiGrid = $state() as FreeFormFlexiGrid;

	bitmaps: number[] = [];
	layout: FreeGridLayout = [];

	#rows: number = $derived(this.#grid.rows);
	#columns: number = $derived(this.#grid.columns);

	constructor(grid: FreeFormFlexiGrid) {
		this.#grid = grid;

		this.updateForColumns(0, this.#grid.columns);
		this.updateForRows(0, this.#grid.rows);

		this.bitmaps = new Array(this.#grid.rows).fill(0);
		this.layout = Array.from({ length: this.#grid.rows }, () =>
			new Array(this.#grid.columns).fill(null)
		);
	}

	addWidget(widget: FlexiWidgetController, x: number, y: number, width: number, height: number) {
		const widgetXBitmap = this.getBitmap(x, width);

		for (let i = y; i < y + height; i++) {
			this.bitmaps[i] |= widgetXBitmap;
		}
		this.setGridRegion(x, y, width, height, widget);
	}

	clear() {
		this.bitmaps = new Array(this.#rows).fill(0);
		this.layout = Array.from({ length: this.#rows }, () => new Array(this.#columns).fill(null));
	}

	removeWidget(widget: FlexiWidgetController) {
		const { x, y, width, height } = widget;

		const widgetXBitmap = this.getBitmap(x, width);

		for (let i = y; i < y + height; i++) {
			this.bitmaps[i] &= ~widgetXBitmap;
		}
		this.setGridRegion(x, y, width, height, null);
	}

	setGridRegion(
		x: number,
		y: number,
		width: number,
		height: number,
		value: FlexiWidgetController | null
	) {
		for (let i = x; i < x + width; i++) {
			for (let j = y; j < y + height; j++) {
				this.layout[j][i] = value;
			}
		}
	}

	getBitmap(start: number, length: number): number {
		// Create a bitmap with 1s for the width of the widget starting at the given position
		let bitmap = 0;

		// Set bits from start to start + length
		for (let i = start; i < start + length; i++) {
			bitmap |= 1 << i;
		}

		return bitmap;
	}

	getCollidingWidgetIfAny(start: number, row: number): FlexiWidgetController | null {
		const occupancy = this.bitmaps[row] & this.getBitmap(start, 1);

		// No collision, good to go.
		if (occupancy === 0) {
			return null;
		}

		const column = this.getFirstCollisionColumn(occupancy);
		return this.layout[row][column];
	}

	getFirstCollisionColumn(occupancy: number): number {
		return Math.floor(Math.log2(occupancy & -occupancy));
	}

	#adjustBitmaps(oldRows: number, newRows: number) {
		if (oldRows === newRows) {
			return;
		}

		if (newRows > oldRows) {
			this.bitmaps.push(...new Array(newRows - oldRows).fill(0));
			return;
		}

		this.bitmaps.splice(newRows);
	}

	#adjustLayoutRows(oldRows: number, newRows: number) {
		if (oldRows === newRows) {
			return;
		}

		if (newRows > oldRows) {
			this.layout.push(
				...Array.from({ length: newRows - oldRows }, () => new Array(this.#columns).fill(null))
			);
			return;
		}

		this.layout.splice(newRows);
	}

	#adjustLayoutColumns(oldColumns: number, newColumns: number) {
		if (oldColumns === newColumns) {
			return;
		}

		if (newColumns > oldColumns) {
			this.layout.forEach((row) => row.push(...new Array(newColumns - oldColumns).fill(null)));
			return;
		}

		this.layout.forEach((row) => row.splice(newColumns));
	}

	updateForRows(oldRows: number, newRows: number) {
		this.#adjustBitmaps(oldRows, newRows);
		this.#adjustLayoutRows(oldRows, newRows);
	}

	updateForColumns(oldColumns: number, newColumns: number) {
		this.#adjustLayoutColumns(oldColumns, newColumns);
	}
}

type FreeGridLayout = (FlexiWidgetController | null)[][];

export type FreeFormTargetLayout = {
	type: 'free';
	minRows?: number;
	minColumns?: number;
	maxRows?: number;
	maxColumns?: number;

	/**
	 * @deprecated Use `maxColumns` instead.
	 */
	expandColumns?: boolean;

	/**
	 * @deprecated Use `maxRows` instead.
	 */
	expandRows?: boolean;
};
type DerivedFreeFormTargetLayout = Required<FreeFormTargetLayout>;

type FreeFormGridSnapshot = {
	layout: FreeGridLayout;
	bitmaps: number[];
	rows: number;
	columns: number;
	widgets: WidgetSnapshot[];
};

type CollisionCheck = {
	widget: FlexiWidgetController;
	x: number;
	y: number;
	width: number;
	height: number;
};
