import type { FlexiTargetConfiguration } from '../target/types.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { FlexiWidgetController } from '../widget/base.svelte.js';
import { FlexiGrid, type MoveOperation, type WidgetSnapshot } from './base.svelte.js';
import type { InternalFlexiWidgetController } from '../widget/controller.svelte.js';

const MAX_COLUMNS = 32;

/**
 * Free-form Flexigrid Layout
 *
 * A grid layout where widgets are explicitly placed in particular cells, and the grid allows for gaps between widgets.
 * A free grid can grow and shrink if required when enabled.
 */
export class FreeFormFlexiGrid extends FlexiGrid {
	#widgets: Set<InternalFlexiWidgetController> = new Set();

	#targetConfig: FlexiTargetConfiguration = $state() as FlexiTargetConfiguration;
	#rawLayoutConfig: FreeFormTargetLayout = $derived(
		this.#targetConfig.layout
	) as FreeFormTargetLayout;

	#layoutConfig: DerivedFreeFormTargetLayout = $derived({
		type: 'free',
		minColumns: this.#rawLayoutConfig?.minColumns ?? 1,
		minRows: this.#rawLayoutConfig?.minRows ?? 1,
		maxColumns: this.#rawLayoutConfig?.maxColumns ?? Infinity,
		maxRows: this.#rawLayoutConfig?.maxRows ?? Infinity,
		collapsibility: this.#rawLayoutConfig?.collapsibility ?? 'any',
		packing: this.#rawLayoutConfig?.packing ?? 'none'
	});

	#rows: number = $state() as number;
	#columns: number = $state() as number;

	#coordinateSystem: FreeFormGridCoordinateSystem = $state() as FreeFormGridCoordinateSystem;

	// Track whether collapsing is needed to defer it until operations complete
	#needsPostEditOperations: boolean = false;

	constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
		super(target, targetConfig);

		this.#targetConfig = targetConfig;

		// $deriveds haven't run by this point, so we need to access the config directly.
		const layout = targetConfig.layout as FreeFormTargetLayout;

		this.#rows = layout.minRows ?? 1;
		this.#columns = layout.minColumns ?? 1;

		this.#coordinateSystem = new FreeFormGridCoordinateSystem(this);
	}

	tryPlaceWidget(
		widget: InternalFlexiWidgetController,
		inputX?: number,
		inputY?: number,
		inputWidth?: number,
		inputHeight?: number,
		isGrabbedWidget: boolean = false
	): boolean {
		let [x, y, width, height] = this.#normalisePlacementDimensions(
			inputX,
			inputY,
			inputWidth,
			inputHeight,
			isGrabbedWidget
		);

		// Constrain the width/height of the widget to the min/max values.
		width = Math.max(widget.minWidth, Math.min(widget.maxWidth, width));
		height = Math.max(widget.minHeight, Math.min(widget.maxHeight, height));

		// We need to try expand the grid if the widget is moving beyond the current bounds,
		// but if this is not possible then the operation fails.
		if (!this.adjustGridDimensionsToFit(x, y, width, height)) {
			return false;
		}

		// Get proposed operations up-front, so we can cancel if needed.
		const operations: Map<InternalFlexiWidgetController, MoveOperation> = new Map();

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

		this.#needsPostEditOperations = true;

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
		if (!this.adjustGridDimensionsToFit(newX, newY, width, height)) {
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

				if (!collidingWidget.isMovable) {
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

	removeWidget(widget: InternalFlexiWidgetController): boolean {
		// Delete it from the grid, incl the coordinate system.
		this.#widgets.delete(widget);
		this.#coordinateSystem.removeWidget(widget);

		// Mark that collapsing is needed, but don't apply it immediately
		this.#needsPostEditOperations = true;

		return true;
	}

	applyPackingIfNeeded(): void {
		if (!this.#needsPostEditOperations) {
			return;
		}

		this.#coordinateSystem.applyPacking();
	}

	/**
	 * Applies row and column collapsing, if needed.
	 */
	applyCollapsingIfNeeded(): void {
		if (!this.#needsPostEditOperations) {
			return;
		}

		const newRows = this.#coordinateSystem.applyRowCollapsibility();
		this.#setRows(newRows);

		const newColumns = this.#coordinateSystem.applyColumnCollapsibility();
		this.#setColumns(newColumns);
	}

	/**
	 * Collapse rows and columns if needed.
	 */
	applyPostCompletionOperations(): void {
		this.applyPackingIfNeeded();
		this.applyCollapsingIfNeeded();

		this.#needsPostEditOperations = false;
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
			})),
			needsPostEditOperations: this.#needsPostEditOperations
		};
	}

	clear() {
		this.#widgets.clear();

		this.#coordinateSystem.updateForRows(this.#rows, this.#layoutConfig.minRows);
		this.#coordinateSystem.updateForColumns(this.#columns, this.#layoutConfig.minColumns);

		this.#rows = this.#layoutConfig.minRows;
		this.#columns = this.#layoutConfig.minColumns;

		this.#coordinateSystem.clear();
		this.#needsPostEditOperations = false;
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

		// Restore the collapsing flag
		this.#needsPostEditOperations = snapshot.needsPostEditOperations;
	}

	mapRawCellToFinalCell(x: number, y: number): [number, number] {
		return [Math.floor(x), Math.floor(y)];
	}

	#normalisePlacementDimensions(
		x?: number,
		y?: number,
		width?: number,
		height?: number,
		isGrabbedWidget?: boolean
	) {
		if (x === undefined || y === undefined) {
			throw new Error(
				'Missing required x and y fields for a widget in a sparse target layout. The x- and y- coordinates of a widget cannot be automatically inferred in this context.'
			);
		}

		// Make sure the grabbed widget can only expand the grid relative from its current dimensions.
		if (isGrabbedWidget) {
			if (x >= this.#columns) {
				x = this.#columns - 1;
			}
			if (y >= this.#rows) {
				y = this.#rows - 1;
			}
		}

		return [x, y, width ?? 1, height ?? 1];
	}

	#doMoveOperation(widget: InternalFlexiWidgetController, operation: MoveOperation) {
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

	adjustGridDimensionsToFit(x: number, y: number, width: number, height: number) {
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

	get collapsibility() {
		return this.#layoutConfig.collapsibility;
	}

	get packing() {
		return this.#layoutConfig.packing;
	}

	get minRows() {
		return this.#layoutConfig.minRows;
	}

	get minColumns() {
		return this.#layoutConfig.minColumns;
	}

	public getWidgetsForModification(): InternalFlexiWidgetController[] {
		return Array.from(this.#widgets);
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

	addWidget(
		widget: InternalFlexiWidgetController,
		x: number,
		y: number,
		width: number,
		height: number
	) {
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

	removeWidget(widget: InternalFlexiWidgetController) {
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
		value: InternalFlexiWidgetController | null
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

	getCollidingWidgetIfAny(start: number, row: number): InternalFlexiWidgetController | null {
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

		// Add rows.
		if (newRows > oldRows) {
			this.layout.push(
				...Array.from({ length: newRows - oldRows }, () => new Array(this.#columns).fill(null))
			);
			return;
		}

		// Remove rows.
		this.layout.splice(newRows);
	}

	#adjustLayoutColumns(oldColumns: number, newColumns: number) {
		if (oldColumns === newColumns) {
			return;
		}

		// Add columns.
		if (newColumns > oldColumns) {
			this.layout.forEach((row) => row.push(...new Array(newColumns - oldColumns).fill(null)));
			return;
		}

		// Remove columns.
		this.layout.forEach((row) => row.splice(newColumns));
	}

	updateForRows(oldRows: number, newRows: number) {
		this.#adjustBitmaps(oldRows, newRows);
		this.#adjustLayoutRows(oldRows, newRows);
	}

	updateForColumns(oldColumns: number, newColumns: number) {
		this.#adjustLayoutColumns(oldColumns, newColumns);
	}

	#isRowEmpty(row: number) {
		return this.bitmaps[row] === 0;
	}

	applyPacking(): void {
		if (this.#grid.packing === 'none') {
			return;
		}

		if (this.#grid.packing === 'horizontal') {
			this.applyHorizontalPacking();
		}

		if (this.#grid.packing === 'vertical') {
			this.applyVerticalPacking();
		}
	}

	applyHorizontalPacking(): void {
		// Pack the widgets that are closest to the left first.
		const sortedWidgets = Array.from(this.#grid.getWidgetsForModification()).toSorted((a, b) => {
			if (a.x == b.x) {
				return a.y - b.y;
			}
			return a.x - b.x;
		});

		for (const widget of sortedWidgets) {
			// We can already automatically eliminate any widget that's at x = 0.
			if (widget.x === 0) {
				continue;
			}

			const x = widget.x;
			const y = widget.y;

			let minimumAvailableShift = 0;

			// Compute the best shift to the left we can achieve for this widget.
			let blocked = false;
			for (let j = x - 1; j >= 0; j--) {
				for (let i = y; i < y + widget.height; i++) {
					if (this.layout[i][j] !== null) {
						blocked = true;
						break;
					}
				}

				if (blocked) {
					break;
				}
				minimumAvailableShift++;
			}

			if (minimumAvailableShift == 0) {
				continue;
			}

			// Remove and re-add the widget so the bitmaps are updated correctly.
			this.removeWidget(widget);

			widget.setBounds(widget.x - minimumAvailableShift, widget.y, widget.width, widget.height);
			this.addWidget(widget, widget.x, widget.y, widget.width, widget.height);
		}
	}

	applyVerticalPacking(): void {
		// Pack the widgets that are closest to the top first.
		const sortedWidgets = Array.from(this.#grid.getWidgetsForModification()).toSorted((a, b) => {
			if (a.y == b.y) {
				return a.x - b.x;
			}
			return a.y - b.y;
		});

		for (const widget of sortedWidgets) {
			// We can already automatically eliminate any widget that's at y = 0.
			if (widget.y === 0) {
				continue;
			}

			const x = widget.x;
			const y = widget.y;

			let minimumAvailableShift = 0;

			// Compute the best shift to the top we can achieve for this widget.
			let blocked = false;
			for (let i = y - 1; i >= 0; i--) {
				for (let j = x; j < x + widget.width; j++) {
					if (this.layout[i][j] !== null) {
						blocked = true;
						break;
					}
				}

				if (blocked) {
					break;
				}
				minimumAvailableShift++;
			}

			if (minimumAvailableShift == 0) {
				continue;
			}

			// Remove and re-add the widget so the bitmaps are updated correctly.
			this.removeWidget(widget);

			widget.setBounds(widget.x, widget.y - minimumAvailableShift, widget.width, widget.height);
			this.addWidget(widget, widget.x, widget.y, widget.width, widget.height);
		}
	}

	applyRowCollapsibility(): number {
		const currentRows = this.#rows;
		const minRows = this.#grid.minRows;
		const collapsibility = this.#grid.collapsibility;

		if (collapsibility === 'none' || currentRows <= minRows) {
			return currentRows;
		}

		let newRows = currentRows;
		let rowsToRemove: number[] = [];

		// Collect all rows that need to be removed based on collapsibility type
		if (collapsibility === 'any') {
			// Remove all empty rows
			for (let i = 0; i < currentRows && currentRows - rowsToRemove.length > minRows; i++) {
				if (this.#isRowEmpty(i)) {
					rowsToRemove.push(i);
				}
			}
		} else if (collapsibility === 'leading' || collapsibility === 'endings') {
			// Remove empty rows from the beginning
			for (let i = 0; i < currentRows && currentRows - rowsToRemove.length > minRows; i++) {
				if (this.#isRowEmpty(i)) {
					rowsToRemove.push(i);
				} else {
					// Stop when we hit the first non-empty row for leading collapsibility
					break;
				}
			}
		}

		if (collapsibility === 'trailing' || collapsibility === 'endings') {
			// Remove empty rows from the end
			for (let i = currentRows - 1; i >= 0 && currentRows - rowsToRemove.length > minRows; i--) {
				if (this.#isRowEmpty(i) && !rowsToRemove.includes(i)) {
					rowsToRemove.push(i);
				} else {
					// Stop when we hit the first non-empty row for trailing collapsibility
					break;
				}
			}
		}

		// Calculate final row count
		newRows = currentRows - rowsToRemove.length;

		// Sort in descending order to remove from end to beginning (avoids index shifting issues)
		rowsToRemove.sort((a, b) => b - a);

		// Remove rows and update widget positions
		for (const rowIndex of rowsToRemove) {
			// Collect widgets to shift BEFORE modifying arrays
			const widgetsToShift = this.#grid
				.getWidgetsForModification()
				.filter((widget) => widget.y > rowIndex);

			// Remove widgets from coordinate system BEFORE splicing
			for (const widget of widgetsToShift) {
				this.removeWidget(widget);
			}

			// Splice the row from layout and bitmaps
			this.layout.splice(rowIndex, 1);
			this.bitmaps.splice(rowIndex, 1);

			// Update widget positions and re-add to coordinate system
			for (const widget of widgetsToShift) {
				const newY = widget.y - 1;
				widget.setBounds(widget.x, newY, widget.width, widget.height);
				this.addWidget(widget, widget.x, newY, widget.width, widget.height);
			}
		}

		return newRows;
	}

	applyColumnCollapsibility(): number {
		const currentColumns = this.#columns;
		const minColumns = this.#grid.minColumns;
		const collapsibility = this.#grid.collapsibility;

		if (collapsibility === 'none' || currentColumns <= minColumns) {
			return currentColumns;
		}

		let newColumns = currentColumns;
		let columnsToRemove: number[] = [];

		// Collect all columns that need to be removed based on collapsibility type
		if (collapsibility === 'any') {
			// Remove all empty columns
			for (
				let i = 0;
				i < currentColumns && currentColumns - columnsToRemove.length > minColumns;
				i++
			) {
				if (this.#isColumnEmpty(i)) {
					columnsToRemove.push(i);
				}
			}
		} else if (collapsibility === 'leading' || collapsibility === 'endings') {
			// Remove empty columns from the beginning
			for (
				let i = 0;
				i < currentColumns && currentColumns - columnsToRemove.length > minColumns;
				i++
			) {
				if (this.#isColumnEmpty(i)) {
					columnsToRemove.push(i);
				} else {
					// Stop when we hit the first non-empty column for leading collapsibility
					break;
				}
			}
		}

		if (collapsibility === 'trailing' || collapsibility === 'endings') {
			// Remove empty columns from the end
			for (
				let i = currentColumns - 1;
				i >= 0 && currentColumns - columnsToRemove.length > minColumns;
				i--
			) {
				if (this.#isColumnEmpty(i) && !columnsToRemove.includes(i)) {
					columnsToRemove.push(i);
				} else {
					// Stop when we hit the first non-empty column for trailing collapsibility
					break;
				}
			}
		}

		// Calculate final column count
		newColumns = currentColumns - columnsToRemove.length;

		// Sort in descending order to remove from end to beginning (avoids index shifting issues)
		columnsToRemove.sort((a, b) => b - a);

		// Remove columns and update widget positions
		for (const columnIndex of columnsToRemove) {
			// Collect widgets to shift BEFORE modifying arrays
			const widgetsToShift = this.#grid
				.getWidgetsForModification()
				.filter((widget) => widget.x > columnIndex);

			// Remove widgets from coordinate system BEFORE splicing
			for (const widget of widgetsToShift) {
				this.removeWidget(widget);
			}

			// Remove the column from the layout
			this.layout.forEach((row) => row.splice(columnIndex, 1));

			// Update bitmaps by removing the column bit and shifting
			for (let rowIndex = 0; rowIndex < this.bitmaps.length; rowIndex++) {
				this.bitmaps[rowIndex] = this.#removeColumnFromBitmap(this.bitmaps[rowIndex], columnIndex);
			}

			// Update widget positions and re-add to coordinate system
			for (const widget of widgetsToShift) {
				const newX = widget.x - 1;
				widget.setBounds(newX, widget.y, widget.width, widget.height);
				this.addWidget(widget, newX, widget.y, widget.width, widget.height);
			}
		}

		return newColumns;
	}

	#isColumnEmpty(column: number): boolean {
		const columnBit = 1 << column;
		for (let row = 0; row < this.bitmaps.length; row++) {
			if (this.bitmaps[row] & columnBit) {
				return false;
			}
		}
		return true;
	}

	#removeColumnFromBitmap(bitmap: number, columnIndex: number): number {
		let result = 0;
		let targetBit = 0;

		for (let sourceBit = 0; sourceBit < 32; sourceBit++) {
			if (sourceBit === columnIndex) {
				// Skip this bit (remove the column)
				continue;
			}

			if (bitmap & (1 << sourceBit)) {
				result |= 1 << targetBit;
			}

			targetBit++;
		}

		return result;
	}
}

type FreeGridLayout = (InternalFlexiWidgetController | null)[][];

type FreeGridCollapsibility = 'none' | 'leading' | 'trailing' | 'endings' | 'any';
type FreeGridPacking = 'none' | 'horizontal' | 'vertical';

export type FreeFormTargetLayout = {
	type: 'free';
	minRows?: number;
	minColumns?: number;
	maxRows?: number;
	maxColumns?: number;
	collapsibility?: FreeGridCollapsibility;
	packing?: FreeGridPacking;
};
type DerivedFreeFormTargetLayout = Required<FreeFormTargetLayout>;

type FreeFormGridSnapshot = {
	layout: FreeGridLayout;
	bitmaps: number[];
	rows: number;
	columns: number;
	widgets: WidgetSnapshot[];
	needsPostEditOperations: boolean;
};

type CollisionCheck = {
	widget: InternalFlexiWidgetController;
	x: number;
	y: number;
	width: number;
	height: number;
};
