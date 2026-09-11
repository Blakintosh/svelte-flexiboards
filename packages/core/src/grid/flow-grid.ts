import { FlexiGrid, type WidgetSnapshot } from './base.js';
import type { Position } from '../types.js';
import type { FlexiWidgetController } from '../widget/base.js';
import type { FlexiTargetConfiguration } from '../target/types.js';
import type { InternalFlexiTargetController } from '../target/controller.js';
import type { InternalFlexiWidgetController } from '../widget/controller.js';
import {
	computed,
	signal,
	trigger,
	untracked,
	type ReadonlySignal,
	type Signal
} from '../reactivity.js';

/**
 * The layout configuration for a flow layout based grid.
 */
export type FlowTargetLayout = {
	type: 'flow';

	/**
	 * Specifies how widgets should be added when no coordinates are specified.
	 *
	 * - "append" will add a widget after the last widget in the grid.
	 * - "prepend" will add a widget before the first widget in the grid.
	 */
	placementStrategy: 'append' | 'prepend';

	/**
	 * When set to true, the grid will ignore coordinates provided when adding widgets and instead
	 * default to the placement strategy's behaviour.
	 */
	disallowInsert?: boolean;

	/**
	 * The axis that widgets are placed along.
	 *
	 * - When set to "row", widgets are added along the columns of a row before wrapping to the next row.
	 * - When set to "column", widgets are added along the rows of a column before wrapping to the next column.
	 */
	flowAxis: 'row' | 'column';

	/**
	 * The maximum number of rows or columns that can be used depending on what the flow axis is set to.
	 *
	 * - When flowAxis is set to "row", the grid will not allow more rows than this value.
	 * - When flowAxis is set to "column", the grid will not allow more columns than this value.
	 */
	maxFlowAxis?: number;

	/**
	 * The number of rows that the grid should have.
	 */
	rows?: number;

	/**
	 * The number of columns that the grid should have.
	 */
	columns?: number;
};

type DerivedFlowTargetLayout = Required<FlowTargetLayout>;

type FlowMoveOperation = {
	widget: InternalFlexiWidgetController;
	newPosition: number;
	width: number;
	height: number;
};

/**
 * Flow-based FlexiGrid Layout
 *
 * A grid layout where widgets are placed using a flow strategy. The flow axis determines which axis the widgets are placed along,
 * and the cross axis can be configured to expand when the flow axis is full.
 * @internal
 */
export class FlowFlexiGrid extends FlexiGrid {
	#targetConfig$: Signal<FlexiTargetConfiguration | null> = signal<FlexiTargetConfiguration | null>(
		null
	);
	#rawLayoutConfig$: ReadonlySignal<FlowTargetLayout> = computed(
		() => this.#targetConfig$()?.layout as FlowTargetLayout
	);

	#state$: Signal<FlexiFlowGridState> = signal({
		rows: 0,
		columns: 0,
		widgets: []
	});

	#layoutConfig$: ReadonlySignal<DerivedFlowTargetLayout> = computed(() => ({
		type: 'flow' as const,
		maxFlowAxis: this.#rawLayoutConfig.maxFlowAxis ?? Infinity,
		flowAxis: untracked(() => this.#rawLayoutConfig.flowAxis) ?? 'row',
		placementStrategy: this.#rawLayoutConfig.placementStrategy ?? 'append',
		rows: this.#rawLayoutConfig.rows ?? 1,
		columns: this.#rawLayoutConfig.columns ?? 1,
		disallowInsert: this.#rawLayoutConfig.disallowInsert ?? false
	}));

	get #rawLayoutConfig(): FlowTargetLayout {
		return this.#rawLayoutConfig$();
	}

	get #layoutConfig(): DerivedFlowTargetLayout {
		return this.#layoutConfig$();
	}

	#coordinateSystem: FlowGridCoordinateSystem = new FlowGridCoordinateSystem(this);
	#dragSnapshot: FlowGridSnapshot | null = null;
	/** 1D position the dragged widget occupied in this grid before it was grabbed, if it came from here. */
	#dragOrigin1D: number | null = null;
	/** Last slot resolved in "cell" mode, held while the pointer is over the shadow itself. */
	#lastCellResolution: [number, number] | null = null;
	/** The widget and side that produced #lastCellResolution, for direction hysteresis. */
	#lastCellWidget: FlexiWidgetController | null = null;
	#lastCellDropAfter = false;

	constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
		super(target, targetConfig);

		this.#targetConfig$(targetConfig);

		const layout = targetConfig.layout as FlowTargetLayout;
		this.rows = layout.rows ?? 1;
		this.columns = layout.columns ?? 1;
	}

	tryPlaceWidget(
		widget: InternalFlexiWidgetController,
		cellX?: number,
		cellY?: number,
		width: number = 1,
		height: number = 1,
		isGrabbedWidget: boolean = false
	): boolean {
		const isRowFlow = this.isRowFlow;

		// Fails if the cross-axis coordinate exceeds the axis length.
		if (!this.#coordinateSystem.coordinateFitsWithinCrossAxis(cellX, cellY)) {
			return false;
		}

		const cellPosition = this.#getPlacementPosition(cellX, cellY);

		// Constrain to the flow axis' length.
		if (isRowFlow && width > this.columns) {
			width = this.columns;
		} else if (!isRowFlow && height > this.rows) {
			height = this.rows;
		}

		// Constrain to the widget's min/max.
		width = Math.max(widget.minWidth, Math.min(widget.maxWidth, width));
		height = Math.max(widget.minHeight, Math.min(widget.maxHeight, height));

		const [index, nearestWidget] = this.#coordinateSystem.findNearestWidget(
			cellPosition,
			0,
			this.#widgets.length - 1
		);

		// No widgets yet, so place at the start.
		if (!nearestWidget) {
			return this.#placeWidgetAt(widget, 0, 0, width, height);
		}

		const nearestWidgetPosition = this.#coordinateSystem.to1D(nearestWidget.x, nearestWidget.y);

		// Nearest widget sits before the target position, so place adjacent to it along the flow axis.
		if (nearestWidgetPosition < cellPosition) {
			return this.#placeWidgetAt(
				widget,
				nearestWidgetPosition + this.#coordinateSystem.getWidgetLength(nearestWidget),
				index + 1,
				width,
				height
			);
		}

		// Try the predecessor's next slot to fill any gap before the nearest widget.
		if (index > 0) {
			const predecessor = this.#widgets[index - 1];
			return this.#placeWidgetAt(
				widget,
				this.#coordinateSystem.to1D(predecessor.x, predecessor.y) +
					this.#coordinateSystem.getWidgetLength(predecessor),
				index,
				width,
				height
			);
		}

		return this.#placeWidgetAt(widget, nearestWidgetPosition, index, width, height);
	}

	#commitOperations(operations: FlowMoveOperation[]) {
		for (const operation of operations) {
			const [newX, newY] = this.#coordinateSystem.to2D(operation.newPosition);
			operation.widget.setBounds(newX, newY, operation.width, operation.height);
		}
		return true;
	}

	#placeWidgetAt(
		widget: InternalFlexiWidgetController,
		position: number,
		index: number,
		width?: number,
		height?: number
	) {
		const operations: FlowMoveOperation[] = [];

		this.#widgets.splice(index, 0, widget);
		if (!this.#shiftWidget(index, position, operations, width, height)) {
			// Undo insertion.
			this.#widgets.splice(index, 1);
			trigger(() => this.#state$());

			return false;
		}

		trigger(() => this.#state$());
		return this.#commitOperations(operations);
	}

	#shiftWidget(
		index: number,
		position: number,
		operations: FlowMoveOperation[],
		width?: number,
		height?: number
	): boolean {
		const widget = this.#widgets[index];
		const isRowFlow = this.isRowFlow;

		// Cross-axis dimension is always 1. Flow-axis dimension uses the given
		// override for the primary widget, or the widget's current size for
		// displaced widgets.
		let effectiveWidth: number;
		let effectiveHeight: number;

		if (isRowFlow) {
			effectiveWidth = width ?? widget.width;
			effectiveHeight = 1;
		} else {
			effectiveWidth = 1;
			effectiveHeight = height ?? widget.height;
		}

		const effectiveLength = isRowFlow ? effectiveWidth : effectiveHeight;

		const finalPosition = this.#coordinateSystem.findPositionToFitWidget(
			widget,
			position,
			effectiveLength
		);

		// Expand the grid if this pushes past the current flow axis end.
		if (!this.#coordinateSystem.expandIfNeededToFit(finalPosition)) {
			return false;
		}

		operations.push({
			widget,
			newPosition: finalPosition,
			width: effectiveWidth,
			height: effectiveHeight
		});

		if (index + 1 >= this.#widgets.length) {
			return true;
		}

		// Shift the remaining widgets along, keeping their current dimensions.
		return this.#shiftWidget(index + 1, finalPosition + effectiveLength, operations);
	}

	#resolveNextPlacementPosition(): number {
		if (!this.#widgets.length) {
			return 0;
		}

		switch (this.#layoutConfig.placementStrategy) {
			case 'prepend': {
				return 0;
			}
			case 'append': {
				const lastWidget = this.#widgets[this.#widgets.length - 1];

				return (
					this.#coordinateSystem.to1D(lastWidget.x, lastWidget.y) +
					this.#coordinateSystem.getWidgetLength(lastWidget)
				);
			}
		}
	}

	#getPlacementPosition(cellX?: number, cellY?: number): number {
		// No coordinates, or insertion disallowed: fall back to the placement strategy.
		if (cellX === undefined || cellY === undefined || this.#layoutConfig.disallowInsert) {
			return this.#resolveNextPlacementPosition();
		}

		// Clamp the coordinates to the grid's bounds.
		return this.#coordinateSystem.to1D(Math.min(cellX, this.columns), Math.min(cellY, this.rows));
	}

	removeWidget(widget: FlexiWidgetController): boolean {
		const [index, foundWidget] = this.#coordinateSystem.findNearestWidgetFrom2D(widget.x, widget.y);

		if (foundWidget !== widget) {
			return false;
		}

		if (!this.#removeWidgetAt(index)) {
			return false;
		}

		const minRows = this.#layoutConfig.rows;
		const minColumns = this.#layoutConfig.columns;

		// Shrink the grid if there's now slack past the last remaining widget.
		const [_, lastWidget] = this.#coordinateSystem.findNearestWidgetFrom2D(Infinity, Infinity);

		if (lastWidget) {
			if (this.#layoutConfig.flowAxis === 'row' && this.rows > lastWidget.y + lastWidget.height) {
				this.rows = Math.max(minRows, lastWidget.y + lastWidget.height);
			} else if (
				this.#layoutConfig.flowAxis === 'column' &&
				this.columns > lastWidget.x + lastWidget.width
			) {
				this.columns = Math.max(minColumns, lastWidget.x + lastWidget.width);
			}
		} else {
			this.rows = minRows;
			this.columns = minColumns;
		}

		return true;
	}

	#removeWidgetAt(index: number) {
		const widget = this.#widgets[index];
		this.#widgets.splice(index, 1);
		trigger(() => this.#state$());

		const operations: FlowMoveOperation[] = [];

		// Re-compact all remaining widgets from position 0. A gap left before the
		// removed widget could now be filled by widgets after it.
		// Example: 3-column grid [A(2-wide), B(2-wide), C(1-wide)] lays out as
		// AA- / BBC (B can't fit at position 2, so it wraps). Removing B should
		// move C into the gap after A (position 2), not to B's old slot (3).

		if (this.#widgets.length > 0) {
			if (!this.#shiftWidget(0, 0, operations)) {
				return false;
			}
		}

		return this.#commitOperations(operations);
	}

	clear() {
		// Truncate in place rather than replacing, to preserve reactivity proxies.
		this.#widgets.length = 0;
		trigger(() => this.#state$());
	}

	takeSnapshot(): FlowGridSnapshot {
		const widgets = this.#widgets.map((widget) => {
			return {
				widget,
				x: widget.x,
				y: widget.y,
				width: widget.width,
				height: widget.height
			};
		});

		return {
			widgets,
			rows: this.rows,
			columns: this.columns
		};
	}

	restoreFromSnapshot(snapshot: FlowGridSnapshot): void {
		this.clear();

		for (const widget of snapshot.widgets) {
			widget.widget.setBounds(widget.x, widget.y, widget.width, widget.height, false);
			this.#widgets.push(widget.widget);
		}
		trigger(() => this.#state$());

		this.rows = snapshot.rows;
		this.columns = snapshot.columns;
	}

	override setDragSnapshot(snapshot: unknown, origin?: Position | null): void {
		this.#dragSnapshot = snapshot as FlowGridSnapshot;
		this.#dragOrigin1D = origin ? this.#coordinateSystem.to1D(origin.x, origin.y) : null;
		this.#lastCellResolution = null;
		this.#lastCellWidget = null;
	}

	override clearDragSnapshot(): void {
		this.#dragSnapshot = null;
		this.#dragOrigin1D = null;
		this.#lastCellResolution = null;
		this.#lastCellWidget = null;
	}

	mapRawCellToFinalCell(x: number, y: number): [number, number] {
		return this.#mapCellToFinalCell(x, y);
	}

	/**
	 * Resolves the hovered cell to an insertion slot like a sortable list: the whole hovered cell is
	 * the target, and before/after is decided by the direction of travel relative to the dragged
	 * widget's current slot rather than by where the pointer sits within the cell.
	 */
	#mapCellToFinalCell(x: number, y: number): [number, number] {
		const coords = this.#coordinateSystem;
		const hovered: [number, number] = [
			Math.max(0, Math.min(Math.floor(x), this.columns - 1)),
			Math.max(0, Math.min(Math.floor(y), this.rows - 1))
		];

		if (!this.#dragSnapshot) {
			return hovered;
		}

		const hovered1D = coords.to1D(hovered[0], hovered[1]);
		const [index, candidate] = coords.findNearestWidgetFrom2D(hovered[0], hovered[1]);

		// findNearestWidget may land on the widget just after the cell. The covering widget, if any,
		// is the last one that starts at or before the hovered cell.
		let covering: FlexiWidgetController | null = null;
		for (const i of [index, index - 1]) {
			const widget = i >= 0 ? this.#widgets[i] : undefined;
			if (!widget) {
				continue;
			}
			const start = coords.to1D(widget.x, widget.y);
			if (start <= hovered1D && hovered1D < start + coords.getWidgetLength(widget)) {
				covering = widget;
				break;
			}
		}

		// Over the shadow (or empty space): keep the current slot stable rather than flickering.
		if (!covering || (covering as InternalFlexiWidgetController).isShadow) {
			if (this.#lastCellResolution) {
				return this.#lastCellResolution;
			}
			return this.#resolveCellFallback(hovered1D);
		}

		const snapshotEntry = this.#dragSnapshot.widgets.find((s) => s.widget === covering);
		if (!snapshotEntry) {
			return hovered;
		}

		const snapshotStart = coords.to1D(snapshotEntry.x, snapshotEntry.y);
		const snapshotLength = this.isRowFlow ? snapshotEntry.width : snapshotEntry.height;

		// Direction is relative to the shadow's current slot, like a sortable list: hovering past the
		// shadow drops after it, hovering before it drops before it. Keeps the original slot reachable.
		// Before the shadow is placed, fall back to the origin; widgets shifted into the origin's slot
		// were after it.
		const shadow = this.#widgets.find((w) => (w as InternalFlexiWidgetController).isShadow);
		const dropAfter = shadow
			? coords.to1D(covering.x, covering.y) > coords.to1D(shadow.x, shadow.y)
			: this.#dragOrigin1D !== null && snapshotStart >= this.#dragOrigin1D;

		// Hysteresis: after resolving a side of a widget, that widget reflows and can land back under a
		// stationary pointer on its other side (a widget taller than the shadow does this). Only flip
		// sides on the same widget if the pointer actually travelled in the new direction.
		if (
			covering === this.#lastCellWidget &&
			dropAfter !== this.#lastCellDropAfter &&
			!this.#pointerTravelled(dropAfter) &&
			this.#lastCellResolution
		) {
			return this.#lastCellResolution;
		}

		const resolved = coords.to2D(dropAfter ? snapshotStart + snapshotLength : snapshotStart);

		this.#lastCellResolution = resolved;
		this.#lastCellWidget = covering;
		this.#lastCellDropAfter = dropAfter;
		return resolved;
	}

	/**
	 * Whether the pointer's last movement was along the flow (forwards if `forward`, else backwards).
	 * Cross-axis movement only counts when the cross axis has more than one cell.
	 */
	#pointerTravelled(forward: boolean): boolean {
		const { x: dx, y: dy } = this._pointerDelta;
		const [main, cross, crossCells] = this.isRowFlow ? [dy, dx, this.columns] : [dx, dy, this.rows];
		const travel = main !== 0 ? main : crossCells > 1 ? cross : 0;
		return forward ? travel > 0 : travel < 0;
	}

	/** Empty space in "cell" mode resolves to the end of the snapshot, clamped to the hovered cell. */
	#resolveCellFallback(hovered1D: number): [number, number] {
		const coords = this.#coordinateSystem;
		let end = 0;
		for (const entry of this.#dragSnapshot!.widgets) {
			end = Math.max(
				end,
				coords.to1D(entry.x, entry.y) + (this.isRowFlow ? entry.width : entry.height)
			);
		}
		const resolved = coords.to2D(Math.min(hovered1D, end));
		this.#lastCellResolution = resolved;
		return resolved;
	}

	get rows(): number {
		return this.#state$().rows;
	}
	set rows(value: number) {
		this.#state$().rows = value;
		trigger(() => this.#state$());
	}
	get columns(): number {
		return this.#state$().columns;
	}
	set columns(value: number) {
		this.#state$().columns = value;
		trigger(() => this.#state$());
	}

	get widgets(): InternalFlexiWidgetController[] {
		return this.#state$().widgets;
	}
	get #widgets(): InternalFlexiWidgetController[] {
		return this.#state$().widgets;
	}
	set #widgets(value: InternalFlexiWidgetController[]) {
		this.#state$().widgets = value;
		trigger(() => this.#state$());
	}

	get isRowFlow(): boolean {
		return this.#layoutConfig.flowAxis === 'row';
	}

	get maxFlowAxis(): number {
		return this.#layoutConfig.maxFlowAxis!;
	}
}

class FlowGridCoordinateSystem {
	#grid$: Signal<FlowFlexiGrid | null> = signal<FlowFlexiGrid | null>(null);
	#isRowFlow$: ReadonlySignal<boolean> = computed(() => this.#grid$()?.isRowFlow ?? false);

	#rows$: ReadonlySignal<number> = computed(() => this.#grid$()?.rows ?? 0);
	#columns$: ReadonlySignal<number> = computed(() => this.#grid$()?.columns ?? 0);
	#widgets$: ReadonlySignal<FlexiWidgetController[]> = computed(() => this.#grid$()?.widgets ?? []);

	get #grid(): FlowFlexiGrid {
		return this.#grid$()!;
	}
	get #isRowFlow(): boolean {
		return this.#isRowFlow$();
	}
	get #rows(): number {
		return this.#rows$();
	}
	get #columns(): number {
		return this.#columns$();
	}
	get #widgets(): FlexiWidgetController[] {
		return this.#widgets$();
	}

	constructor(grid: FlowFlexiGrid) {
		this.#grid$(grid);
	}

	to1D(x: number, y: number): number {
		if (this.#isRowFlow) {
			return y * this.#grid.columns + x;
		}

		return x * this.#grid.rows + y;
	}

	to2D(index: number): [number, number] {
		if (this.#isRowFlow) {
			return [this.getCrossAxisCoordinate(index), this.getFlowAxisCoordinate(index)];
		}

		return [this.getFlowAxisCoordinate(index), this.getCrossAxisCoordinate(index)];
	}

	getWidgetLength(widget: FlexiWidgetController): number {
		if (this.#isRowFlow) {
			return widget.width;
		}

		return widget.height;
	}

	getFlowAxisCoordinate(position: number): number {
		if (this.#isRowFlow) {
			return Math.floor(position / this.#grid.columns);
		}

		return Math.floor(position / this.#grid.rows);
	}

	getCrossAxisCoordinate(position: number): number {
		if (this.#isRowFlow) {
			return position % this.#grid.columns;
		}

		return position % this.#grid.rows;
	}

	findNearestWidgetFrom2D(x: number, y: number): [number, FlexiWidgetController | null] {
		const position = this.to1D(x, y);

		return this.findNearestWidget(position, 0, this.#widgets.length - 1);
	}

	findNearestWidget(
		position: number,
		searchStart: number,
		searchEnd: number
	): [number, FlexiWidgetController | null] {
		if (this.#widgets.length === 0) {
			return [0, null];
		}

		if (searchStart === searchEnd) {
			return [searchStart, this.#widgets[searchStart]];
		}

		const median = Math.floor((searchStart + searchEnd) / 2);
		const widget = this.#widgets[median];

		const widgetValue = this.to1D(widget.x, widget.y);

		if (widgetValue === position) {
			return [median, widget];
		} else if (widgetValue < position) {
			return this.findNearestWidget(position, median + 1, searchEnd);
		} else {
			return this.findNearestWidget(position, searchStart, median);
		}
	}

	coordinateFitsWithinCrossAxis(x?: number, y?: number): boolean {
		// Width/height isn't checked here since it just wraps to the next row/column.
		if (this.#isRowFlow && x !== undefined && x > this.#columns) {
			return false;
		}

		return !(!this.#isRowFlow && y !== undefined && y > this.#rows);
	}

	findPositionToFitWidget(
		widget: FlexiWidgetController,
		basePosition: number,
		overrideLength?: number
	): number {
		const widgetLength = overrideLength ?? this.getWidgetLength(widget);
		const crossPosition = this.getCrossAxisCoordinate(basePosition);

		const crossAxisLength = this.getCrossAxisLength();

		if (crossPosition + widgetLength <= crossAxisLength) {
			return basePosition;
		}

		// Doesn't fit on the current row/column, so move to the next one.
		const flowIndex = this.getFlowAxisCoordinate(basePosition);
		return (flowIndex + 1) * crossAxisLength;
	}

	expandIfNeededToFit(position: number): boolean {
		const length = this.getFlowAxisLength();
		const flowAxisPosition = Math.floor(position / this.getCrossAxisLength());

		// Past the flow axis' current length, so expand if possible.
		if (flowAxisPosition >= length) {
			return this.setFlowAxisLengthIfPossible(flowAxisPosition + 1);
		}

		return true;
	}

	setFlowAxisLengthIfPossible(length: number): boolean {
		if (length > this.#grid.maxFlowAxis) {
			return false;
		}

		if (this.#isRowFlow) {
			this.#grid.rows = length;
			return true;
		}

		this.#grid.columns = length;
		return true;
	}

	getFlowAxisLength(): number {
		if (this.#isRowFlow) {
			return this.#grid.rows;
		}

		return this.#grid.columns;
	}

	getCrossAxisLength(): number {
		if (this.#isRowFlow) {
			return this.#grid.columns;
		}

		return this.#grid.rows;
	}
}

type FlexiFlowGridState = {
	rows: number;
	columns: number;
	widgets: InternalFlexiWidgetController[];
};

type FlowGridSnapshot = {
	widgets: WidgetSnapshot[];
	rows: number;
	columns: number;
};
