import type { FlexiTargetConfiguration } from '../target/types.js';
import type { InternalFlexiTargetController } from '../target/controller.js';
import type { FlexiWidgetController } from '../widget/base.js';
import { FlexiGrid, type MoveOperation, type WidgetSnapshot } from './base.js';
import type { InternalFlexiWidgetController } from '../widget/controller.js';
import { computed, signal, type ReadonlySignal, type Signal } from '../reactivity.js';

const MAX_COLUMNS = 32;

/**
 * Free-form Flexigrid Layout
 *
 * A grid layout where widgets are explicitly placed in particular cells, and the grid allows for gaps between widgets.
 * A free grid can grow and shrink if required when enabled.
 */
export class FreeFormFlexiGrid extends FlexiGrid {
	#widgets: Set<InternalFlexiWidgetController> = new Set();

	#targetConfig$: Signal<FlexiTargetConfiguration | null> = signal<FlexiTargetConfiguration | null>(
		null
	);
	#rawLayoutConfig$: ReadonlySignal<FreeFormTargetLayout> = computed(
		() => this.#targetConfig$()?.layout as FreeFormTargetLayout
	);

	#layoutConfig$: ReadonlySignal<DerivedFreeFormTargetLayout> = computed(() => ({
		type: 'free' as const,
		minColumns: this.#rawLayoutConfig?.minColumns ?? 1,
		minRows: this.#rawLayoutConfig?.minRows ?? 1,
		maxColumns: this.#rawLayoutConfig?.maxColumns ?? Infinity,
		maxRows: this.#rawLayoutConfig?.maxRows ?? Infinity,
		collapsibility: this.#rawLayoutConfig?.collapsibility ?? 'any',
		packing: this.#rawLayoutConfig?.packing ?? 'none'
	}));

	get #rawLayoutConfig(): FreeFormTargetLayout {
		return this.#rawLayoutConfig$();
	}

	get #layoutConfig(): DerivedFreeFormTargetLayout {
		return this.#layoutConfig$();
	}

	#rows$: Signal<number> = signal<number>(0);
	#columns$: Signal<number> = signal<number>(0);

	#coordinateSystem$: Signal<FreeFormGridCoordinateSystem | null> =
		signal<FreeFormGridCoordinateSystem | null>(null);

	get #rows(): number {
		return this.#rows$();
	}
	set #rows(value: number) {
		this.#rows$(value);
	}
	get #columns(): number {
		return this.#columns$();
	}
	set #columns(value: number) {
		this.#columns$(value);
	}
	get #coordinateSystem(): FreeFormGridCoordinateSystem {
		return this.#coordinateSystem$()!;
	}

	// Deferred until operations complete, then run once.
	#needsPostEditOperations: boolean = false;

	constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
		super(target, targetConfig);

		this.#targetConfig$(targetConfig);

		// $deriveds haven't run by this point, so we need to access the config directly.
		const layout = targetConfig.layout as FreeFormTargetLayout;

		this.#rows = layout.minRows ?? 1;
		this.#columns = layout.minColumns ?? 1;

		this.#coordinateSystem$(new FreeFormGridCoordinateSystem(this));
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

		// Constrain to the widget's min/max.
		width = Math.max(widget.minWidth, Math.min(widget.maxWidth, width));
		height = Math.max(widget.minHeight, Math.min(widget.maxHeight, height));

		// Expand the grid if this moves beyond current bounds; fail if that's not possible.
		if (!this.adjustGridDimensionsToFit(x, y, width, height)) {
			return false;
		}

		// Collect proposed operations up front so they can be cancelled.
		const operations: Map<InternalFlexiWidgetController, MoveOperation> = new Map();

		if (!this.#resolveCollisions({ widget, x, y, width, height }, operations)) {
			this.#rollbackOperations(operations, new Map());
			return false;
		}

		// The coordinate system already reflects every pending move; commit them to the widgets.
		for (const operation of operations.values()) {
			operation.widget.setBounds(
				operation.newX,
				operation.newY,
				operation.widget.width,
				operation.widget.height
			);
		}

		// Place the widget now that others have moved out of the way.
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

		// Expand the grid if this moves beyond current bounds; fail if that's not possible.
		if (!this.adjustGridDimensionsToFit(newX, newY, width, height)) {
			return false;
		}

		// Scan row-by-row from the far corner back to the origin: widgets are pushed right/down,
		// so resolving the farthest one first means nearer ones land behind it, not leapfrog it.
		for (let i = newY + height - 1; i >= newY; i--) {
			for (let j = newX + width - 1; j >= newX; j--) {
				const collidingWidget = this.#coordinateSystem.getCollidingWidgetIfAny(j, i);

				if (!collidingWidget) {
					continue;
				}

				if (!collidingWidget.isMovable) {
					return false;
				}

				// The widget may already have a pending move; collisions happen wherever it currently sits.
				const { x: currentX, y: currentY } = this.#pendingPositionOf(collidingWidget, operations);

				// Remove it from the coordinate system so it can't collide with itself.
				this.#coordinateSystem.removeWidgetAt(collidingWidget, currentX, currentY);

				// Try displacing along x, then along y.
				if (
					displaceX &&
					this.#attemptDisplacement(
						collidingWidget,
						newX + width,
						currentY,
						operations,
						displaceX,
						false
					)
				) {
					continue;
				}

				if (
					displaceY &&
					this.#attemptDisplacement(
						collidingWidget,
						currentX,
						newY + height,
						operations,
						false,
						displaceY
					)
				) {
					continue;
				}

				// Neither worked: put the widget back and let the caller unwind.
				this.#coordinateSystem.addWidget(
					collidingWidget,
					currentX,
					currentY,
					collidingWidget.width,
					collidingWidget.height
				);
				return false;
			}
		}
		return true;
	}

	removeWidget(widget: InternalFlexiWidgetController): boolean {
		this.#widgets.delete(widget);
		this.#coordinateSystem.removeWidget(widget);

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
		// Deep copy again since the snapshot may be reused.
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

		// A grabbed widget can only expand the grid relative to its current dimensions.
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

	/**
	 * Where a widget currently sits during collision resolution: its pending move if it has one,
	 * otherwise its committed bounds.
	 */
	#pendingPositionOf(
		widget: InternalFlexiWidgetController,
		operations: Map<FlexiWidgetController, MoveOperation>
	): { x: number; y: number } {
		const pending = operations.get(widget);
		return pending ? { x: pending.newX, y: pending.newY } : { x: widget.x, y: widget.y };
	}

	/**
	 * Tries to relocate a (currently removed) widget to (x, y), resolving whatever it collides with
	 * there. On success the widget is placed in the coordinate system at the new position and the
	 * move is recorded; on failure every change made during the attempt is rolled back.
	 */
	#attemptDisplacement(
		widget: InternalFlexiWidgetController,
		x: number,
		y: number,
		operations: Map<FlexiWidgetController, MoveOperation>,
		displaceX: boolean,
		displaceY: boolean
	): boolean {
		const previous = new Map(operations);

		const resolved = this.#resolveCollisions(
			{ widget, x, y, width: widget.width, height: widget.height },
			operations,
			displaceX,
			displaceY
		);

		if (!resolved) {
			this.#rollbackOperations(operations, previous);
			return false;
		}

		operations.set(widget, { widget, newX: x, newY: y, oldX: widget.x, oldY: widget.y });
		this.#coordinateSystem.addWidget(widget, x, y, widget.width, widget.height);
		return true;
	}

	/**
	 * Undoes every move recorded in `operations` since `previous` was captured, both in the
	 * coordinate system and in the map itself, leaving `operations` equal to `previous`.
	 */
	#rollbackOperations(
		operations: Map<FlexiWidgetController, MoveOperation>,
		previous: Map<FlexiWidgetController, MoveOperation>
	) {
		// Unwind in reverse insertion order so nested attempts are undone before their parents.
		for (const [widget, operation] of [...operations.entries()].reverse()) {
			const before = previous.get(widget);
			if (before === operation) {
				continue;
			}

			this.#coordinateSystem.removeWidgetAt(operation.widget, operation.newX, operation.newY);

			const restoreX = before ? before.newX : operation.oldX;
			const restoreY = before ? before.newY : operation.oldY;
			this.#coordinateSystem.addWidget(
				operation.widget,
				restoreX,
				restoreY,
				operation.widget.width,
				operation.widget.height
			);
		}

		operations.clear();
		for (const [widget, operation] of previous) {
			operations.set(widget, operation);
		}
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
	#grid$: Signal<FreeFormFlexiGrid | null> = signal<FreeFormFlexiGrid | null>(null);

	bitmaps: number[] = [];
	layout: FreeGridLayout = [];

	#rows$: ReadonlySignal<number> = computed(() => this.#grid.rows);
	#columns$: ReadonlySignal<number> = computed(() => this.#grid.columns);

	get #grid(): FreeFormFlexiGrid {
		return this.#grid$()!;
	}
	get #rows(): number {
		return this.#rows$();
	}
	get #columns(): number {
		return this.#columns$();
	}

	constructor(grid: FreeFormFlexiGrid) {
		this.#grid$(grid);

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
		this.removeWidgetAt(widget, widget.x, widget.y);
	}

	/**
	 * Clears the region a widget occupies at an explicit position — needed while a move is
	 * pending, when the coordinate system holds the widget somewhere other than its bounds say.
	 */
	removeWidgetAt(widget: InternalFlexiWidgetController, x: number, y: number) {
		const { width, height } = widget;

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
		let bitmap = 0;

		for (let i = start; i < start + length; i++) {
			bitmap |= 1 << i;
		}

		return bitmap;
	}

	getCollidingWidgetIfAny(start: number, row: number): InternalFlexiWidgetController | null {
		const occupancy = this.bitmaps[row] & this.getBitmap(start, 1);

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
		// Pack widgets closest to the left first.
		const sortedWidgets = Array.from(this.#grid.getWidgetsForModification()).sort((a, b) => {
			if (a.x == b.x) {
				return a.y - b.y;
			}
			return a.x - b.x;
		});

		for (const widget of sortedWidgets) {
			if (widget.x === 0) {
				continue;
			}

			const x = widget.x;
			const y = widget.y;

			let minimumAvailableShift = 0;

			// Find the largest shift left that stays clear.
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

			// Remove and re-add so the bitmaps update correctly.
			this.removeWidget(widget);

			widget.setBounds(widget.x - minimumAvailableShift, widget.y, widget.width, widget.height);
			this.addWidget(widget, widget.x, widget.y, widget.width, widget.height);
		}
	}

	applyVerticalPacking(): void {
		// Pack widgets closest to the top first.
		const sortedWidgets = Array.from(this.#grid.getWidgetsForModification()).sort((a, b) => {
			if (a.y == b.y) {
				return a.x - b.x;
			}
			return a.y - b.y;
		});

		for (const widget of sortedWidgets) {
			if (widget.y === 0) {
				continue;
			}

			const x = widget.x;
			const y = widget.y;

			let minimumAvailableShift = 0;

			// Find the largest shift up that stays clear.
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

			// Remove and re-add so the bitmaps update correctly.
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

		if (collapsibility === 'any') {
			for (let i = 0; i < currentRows && currentRows - rowsToRemove.length > minRows; i++) {
				if (this.#isRowEmpty(i)) {
					rowsToRemove.push(i);
				}
			}
		} else if (collapsibility === 'leading' || collapsibility === 'endings') {
			for (let i = 0; i < currentRows && currentRows - rowsToRemove.length > minRows; i++) {
				if (this.#isRowEmpty(i)) {
					rowsToRemove.push(i);
				} else {
					// Stop at the first non-empty row.
					break;
				}
			}
		}

		if (collapsibility === 'trailing' || collapsibility === 'endings') {
			for (let i = currentRows - 1; i >= 0 && currentRows - rowsToRemove.length > minRows; i--) {
				if (this.#isRowEmpty(i) && !rowsToRemove.includes(i)) {
					rowsToRemove.push(i);
				} else {
					// Stop at the first non-empty row.
					break;
				}
			}
		}

		newRows = currentRows - rowsToRemove.length;

		// Descending order, so removal from the end doesn't shift earlier indices.
		rowsToRemove.sort((a, b) => b - a);

		for (const rowIndex of rowsToRemove) {
			// Collect widgets to shift before modifying the arrays.
			const widgetsToShift = this.#grid
				.getWidgetsForModification()
				.filter((widget) => widget.y > rowIndex);

			// Remove from the coordinate system before splicing.
			for (const widget of widgetsToShift) {
				this.removeWidget(widget);
			}

			this.layout.splice(rowIndex, 1);
			this.bitmaps.splice(rowIndex, 1);

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

		if (collapsibility === 'any') {
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
			for (
				let i = 0;
				i < currentColumns && currentColumns - columnsToRemove.length > minColumns;
				i++
			) {
				if (this.#isColumnEmpty(i)) {
					columnsToRemove.push(i);
				} else {
					// Stop at the first non-empty column.
					break;
				}
			}
		}

		if (collapsibility === 'trailing' || collapsibility === 'endings') {
			for (
				let i = currentColumns - 1;
				i >= 0 && currentColumns - columnsToRemove.length > minColumns;
				i--
			) {
				if (this.#isColumnEmpty(i) && !columnsToRemove.includes(i)) {
					columnsToRemove.push(i);
				} else {
					// Stop at the first non-empty column.
					break;
				}
			}
		}

		newColumns = currentColumns - columnsToRemove.length;

		// Descending order, so removal from the end doesn't shift earlier indices.
		columnsToRemove.sort((a, b) => b - a);

		for (const columnIndex of columnsToRemove) {
			// Collect widgets to shift before modifying the arrays.
			const widgetsToShift = this.#grid
				.getWidgetsForModification()
				.filter((widget) => widget.x > columnIndex);

			// Remove from the coordinate system before splicing.
			for (const widget of widgetsToShift) {
				this.removeWidget(widget);
			}

			this.layout.forEach((row) => row.splice(columnIndex, 1));

			for (let rowIndex = 0; rowIndex < this.bitmaps.length; rowIndex++) {
				this.bitmaps[rowIndex] = this.#removeColumnFromBitmap(this.bitmaps[rowIndex], columnIndex);
			}

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

	/**
	 * The minimum number of rows the grid should have. The grid never shrinks below this.
	 * @default 1
	 */
	minRows?: number;

	/**
	 * The minimum number of columns the grid should have. The grid never shrinks below this.
	 * @default 1
	 */
	minColumns?: number;

	/**
	 * The maximum number of rows the grid may expand to. Set equal to `minRows` to fix the row count.
	 * @default Infinity
	 */
	maxRows?: number;

	/**
	 * The maximum number of columns the grid may expand to, capped at 32. Set equal to `minColumns` to fix the column count.
	 * @default Infinity
	 */
	maxColumns?: number;

	/**
	 * Whether the grid collapses to remove empty rows and columns, and where.
	 *
	 * - "none" never collapses.
	 * - "leading" collapses empty rows/columns at the start of the grid.
	 * - "trailing" collapses empty rows/columns at the end of the grid.
	 * - "endings" collapses at either end.
	 * - "any" collapses any empty row/column.
	 * @default "none"
	 */
	collapsibility?: FreeGridCollapsibility;

	/**
	 * Whether widgets are packed towards an edge after each change, closing gaps.
	 *
	 * - "none" leaves widgets where they were placed.
	 * - "horizontal" slides widgets left as far as they can go, left-most first.
	 * - "vertical" slides widgets up as far as they can go, top-most first.
	 * @default "none"
	 */
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
