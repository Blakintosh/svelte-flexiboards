import type { FlexiWidgetController } from "./widget.svelte.js";
import { setContext, untrack } from "svelte";
import { getContext } from "svelte";
import type { InternalFlexiTargetController, FlexiTargetConfiguration, TargetSizing } from "./target.svelte.js";
import { getInternalFlexitargetCtx } from "./target.svelte.js";
import { GridDimensionTracker } from "./utils.svelte.js";
import type { FlexiTarget } from "../../../dist/index.js";

type FlexiGridLayout = (FlexiWidgetController | null)[][];

export type FlowTargetLayout = {
    type: "flow";

    /**
     * Specifies how widgets should be added when no coordinates are specified.
     * 
     * - "append" will add a widget after the last widget in the grid.
     * - "prepend" will add a widget before the first widget in the grid.
     */
    placementStrategy: "append" | "prepend";
    
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
    flowAxis: "row" | "column";

    /**
     * Whether the grid should be blocked from automatically expanding when all cell space is used.
     * 
     * - When unset and the flow axis is set to "row", the grid will create new rows when the last row is full.
     * - When unset and the flow axis is set to "column", the grid will create new columns when the last column is full.
     * - When set to true, the grid will be at capacity when all cells are used.
     */
    disallowExpansion?: boolean;

    /**
     * The maximum number of rows or columns that can be used depending on what the flow axis is set to.
     * 
     * - When flowAxis is set to "row", the grid will not allow more rows than this value.
     * - When flowAxis is set to "column", the grid will not allow more columns than this value.
     */
    maxFlowAxis?: number;
};

export type FreeFormTargetLayout = {
    type: "free";
    expandColumns?: boolean;
    expandRows?: boolean;
    minRows?: number;
    minColumns?: number;
}

export type MoveOperation = {
    widget: FlexiWidgetController;
    newX: number;
    newY: number;
    oldX: number;
    oldY: number;
}

type FreeFormGridSnapshot = {
    layout: FlexiGridLayout;
    bitmaps: number[];
    rows: number;
    columns: number;
    widgets: WidgetSnapshot[];
}

type FlowGridSnapshot = {
    widgets: WidgetSnapshot[];
    rows: number;
    columns: number;
}

type WidgetSnapshot = {
    widget: FlexiWidgetController;
    x: number;
    y: number;
    width: number;
    height: number;
}

const MAX_COLUMNS = 32;

export abstract class FlexiGrid {
    abstract tryPlaceWidget(widget: FlexiWidgetController, cellX?: number, cellY?: number, width?: number, height?: number): boolean;
    abstract removeWidget(widget: FlexiWidgetController): boolean;
    abstract takeSnapshot(): unknown;
    abstract restoreFromSnapshot(snapshot: unknown): void;
    abstract mapRawCellToFinalCell(x: number, y: number): [number, number];

    _target: InternalFlexiTargetController;
    _targetConfig: FlexiTargetConfiguration;

    mouseCellPosition: { x: number, y: number } = $state({
        x: 0,
        y: 0
    });


	#ref: { ref: HTMLElement | null } = $state({ ref: null });

    _dimensionTracker: GridDimensionTracker;

    constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
        this._target = target;
        this._targetConfig = targetConfig;

        this._dimensionTracker = new GridDimensionTracker(this, targetConfig);

        this.onpointermove = this.onpointermove.bind(this);

        $effect(() => {
            window.addEventListener('pointermove', this.onpointermove);

            return () => {
                window.removeEventListener('pointermove', this.onpointermove);
            };
        });
    }

    style: string = $derived.by(() => {
        return `display: grid; grid-template-columns: ${this.#getSizing(this.columns, this._targetConfig.columnSizing)}; grid-template-rows: ${this.#getSizing(this.rows, this._targetConfig.rowSizing)};`;
    });

    #getSizing(axisCount: number, sizing: TargetSizing) {
        if(typeof sizing === "string") {
            return `repeat(${axisCount}, ${sizing})`;
        }
        return sizing({ target: this._target, grid: this });
    }

    #updatePointerPosition(clientX: number, clientY: number) {
        if (!this.ref) {
            return;
        }

        const rawCell = this._dimensionTracker.getCellFromPointerPosition(clientX, clientY);

        let cell = rawCell;
        if(rawCell) {
            const [x, y] = this.mapRawCellToFinalCell(rawCell.column, rawCell.row);
            cell = {
                row: y,
                column: x
            };
        }

        this.mouseCellPosition.x = cell?.column ?? 0;
        this.mouseCellPosition.y = cell?.row ?? 0;

        this._target.onmousegridcellmove({
            cellX: this.mouseCellPosition.x,
            cellY: this.mouseCellPosition.y
        });
    }

    watchGridElementDimensions() {
        if(!this.ref) {
            return;
        }

        this._dimensionTracker.watchGrid();
    }

    /**
     * Clears the grid layout.
     */
    abstract clear(): void;

    onpointermove(event: PointerEvent) {
        this.#updatePointerPosition(event.clientX, event.clientY);
    }

    // Getters
    abstract get rows(): number;
    abstract get columns(): number;

    get ref() {
        return this.#ref.ref;
    }
    set ref(ref: HTMLElement | null) {
        this.#ref.ref = ref;
    }
}

/**
 * Free-form Flexigrid Layout
 * 
 * A grid layout where widgets are explicitly placed in particular cells, and the grid allows for gaps between widgets.
 * A free grid can grow and shrink if required when enabled.
 */
export class FreeFormFlexiGrid extends FlexiGrid {
    #widgets: Set<FlexiWidgetController> = new Set();

    #state: FlexiFreeFormGridState = $state({
        rows: 0,
        columns: 0,
        layout: [],
        bitmaps: []
    });

    #targetConfig: FlexiTargetConfiguration = $state() as FlexiTargetConfiguration;
    #rawLayoutConfig: FreeFormTargetLayout = $derived(this.#targetConfig?.layout) as FreeFormTargetLayout;

    #layoutConfig: FreeFormTargetLayout = $derived({
        type: "free",
        expandColumns: this.#rawLayoutConfig?.expandColumns ?? false,
        expandRows: this.#rawLayoutConfig?.expandRows ?? false,
        minColumns: this.#rawLayoutConfig?.minColumns ?? this.#targetConfig.baseColumns ?? 1,
        minRows: this.#rawLayoutConfig?.minRows ?? this.#targetConfig.baseRows ?? 1
    });

    constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
        super(target, targetConfig);

        this.#targetConfig = targetConfig;

        this.#rows = targetConfig.baseRows ?? 1;
        this.#columns = targetConfig.baseColumns ?? 1;

        this.#bitmaps = new Array(this.#rows).fill(0);

        this.#layout = new Array(this.#rows).fill(new Array(this.#columns).fill(null));
    }

    tryPlaceWidget(widget: FlexiWidgetController, cellX?: number, cellY?: number, width?: number, height?: number): boolean {
        // Need both coordinates to place a widget.
        if(cellX === undefined || cellY === undefined) {
            throw new Error("Missing required x and y fields for a widget in a sparse target layout. The x- and y- coordinates of a widget cannot be automatically inferred in this context.");
        }

        // If no width or height is specified, default to 1.
        width ??= 1;
        height ??= 1;

        // When placing a widget, we should constrain it so that it can only make so many more columns/rows more than the current grid size.
        if(cellX >= this.#columns) {
            cellX = this.#columns - 1;
        }
        if(cellY >= this.#rows) {
            cellY = this.#rows - 1;
        }

        const widgetXBitmap = this.#createWidgetBitmap(widget, cellX, width);

        const endCellX = cellX + width;
        const endCellY = cellY + height;

        // We need to try expand the grid if the widget is moving beyond the current bounds,
        // but if this is not possible then the operation fails.
        if(endCellX > this.#columns && !this.#tryExpandColumns(endCellX)) {
            return false;
        }
        if(endCellY > this.#rows && !this.#tryExpandRows(endCellY)) {
            return false;
        }

        // We'll use this to accumulate operations that will get carried out once all collisions are resolved
        // successfully, in an all-or-nothing manner.
        // Where a widget gets moved multiple times - ie it collides with multiple rows - we'll only
        // carry out the operation once, for the maximal move.
        const operations: Map<FlexiWidgetController, MoveOperation> = new Map();

        // Looking row-by-row, we can identify collisions using the bitmaps.
        for(let i = cellY; i < cellY + height; i++) {
            // Expand rows as necessary if this operation is supported.
            while(this.#bitmaps.length <= i) {
                this.#bitmaps.push(0);
                this.#layout.push(new Array(this.#columns).fill(null));
            }

            // Intersection of the bitmaps will tell us whether there's a collision.
            // If there isn't, check the next row.
            if(!(this.#bitmaps[i] & widgetXBitmap)) {
                continue;
            }

            // Find the first widget of this row that's intersecting, then push it out of the way
            // which in turn will push any other widgets out of the way on this row.
            for(let j = cellX; j < cellX + width; j++) { 
                const collidingWidget = this.#layout[i][j];

                if(!collidingWidget) {
                    continue;
                }
                const xMoveBy = (cellX + width) - collidingWidget.x;
                const yMoveBy = (cellY + height) - collidingWidget.y;

                // PATCH: y-move seems to go weird, sometimes.
                if(!this.#prepareMoveWidgetX(collidingWidget, xMoveBy, operations) && !this.#prepareMoveWidgetY(collidingWidget, yMoveBy, operations)) {
                    // If moving along either axis is not possible, then the overall operation is not possible.
                    return false;
                }
                // Don't need to do this again for this row.
                break;
            }
        }

        // No collisions, or we can resolve them.

        // Apply all other necessary move operations.
        for(const operation of operations.values()) {
            this.#doMoveOperation(operation.widget, operation);
        }

        // Place the widget now that all other widgets have been moved out of the way.
        for(let i = cellX; i < cellX + width; i++) {
            for(let j = cellY; j < cellY + height; j++) {
                this.#layout[j][i] = widget;
            }
        }

        this.#widgets.add(widget);
        // this._dimensionTracker.trackWidget(widget, widget.ref);

        // Update the row bitmaps to reflect the widget's placement.
        for(let i = cellY; i < cellY + height; i++) {
            this.#bitmaps[i] |= widgetXBitmap;
        }

        widget.setBounds(cellX, cellY, width, height);
        return true;
    }

    #prepareMoveWidgetX(widget: FlexiWidgetController, delta: number, operationMap: Map<FlexiWidgetController, MoveOperation>): boolean {
        // If the widget is not draggable then we definitely can't push it.
        if(!widget.draggable) {
            return false;
        }

        const finalStartX = widget.x + delta;
        const finalEndX = finalStartX + widget.width;

        // Shortcut: if the widget is already being moved and this is further than the proposed move,
        // then we can forgo remaining checks as the maximal move is the one that gets applied.
        if(operationMap.has(widget)) {
            const existingOperation = operationMap.get(widget)!;

            if(existingOperation.newX >= finalStartX) {
                return true;
            }
        }

        // We need to try expand the grid if the widget is moving beyond the current bounds,
        // but if this is not possible then the operation fails.
        if(finalEndX > this.#columns && !this.#tryExpandColumns(finalEndX)) {
            return false;
        }

        // If a widget lies between this widget's current position and its new end position then it's,
        // by definition, colliding with it. We need to check if we can move the widget and collapse
        // any gaps along the way.
        for(let i = widget.y; i < widget.y + widget.height; i++) {
            for(let j = widget.x + widget.width; j < finalEndX; j++) {
                const cell = this.#layout[i][j];

                // Empty cell
                if(!cell) {
                    continue;
                }

                // A widget lies between this widget's current position and its new end position.
                // Recurse to push it out of the way, and if that fails then the whole operation fails.
                const xGapSize = j - (widget.x + widget.width);
                const yGapSize = i - (widget.y + widget.height);

                // NEXT: Heuristic to immediately cancel move if delta - gapSize > available space. Use #countSetBits for this

                if(!this.#prepareMoveWidgetX(cell, delta - xGapSize, operationMap)) {
                    return false;
                }
                // We can move the colliding widget, we don't need to check this row any further as the move
                // handles any subsequent collisions.
                break;
            }
        }

        // The move is possible. Add the operation to the accumulator so we can carry them out if all are OK.
        const operation = {
            widget,
            oldX: widget.x,
            oldY: widget.y,
            newX: finalStartX,
            newY: widget.y
        };

        operationMap.set(widget, operation);

        return true;
    }

    #prepareMoveWidgetY(widget: FlexiWidgetController, delta: number, operationMap: Map<FlexiWidgetController, MoveOperation>): boolean {
        // If the widget is not draggable then we definitely can't push it.
        if(!widget.draggable) {
            return false;
        }

        const finalStartY = widget.y + delta;
        const finalEndY = finalStartY + widget.height;

        // Shortcut: if the widget is already being moved and this is further than the proposed move,
        // then we can forgo remaining checks as the maximal move is the one that gets applied.
        if(operationMap.has(widget)) {
            const existingOperation = operationMap.get(widget)!;

            if(existingOperation.newY >= finalStartY) {
                return true;
            }
        }

        // We need to try expand the grid if the widget is moving beyond the current bounds,
        // but if this is not possible then the operation fails.
        if(finalEndY > this.#rows && !this.#tryExpandRows(finalEndY)) {
            return false;
        }

        // If a widget lies between this widget's current position and its new end position then it's,
        // by definition, colliding with it. We need to check if we can move the widget and collapse
        // any gaps along the way.
        for(let i = widget.y; i < widget.y + widget.height; i++) {
            for(let j = widget.x + widget.width; j < finalEndY; j++) {
                const cell = this.#layout[i][j];

                // Empty cell
                if(!cell) {
                    continue;
                }

                // A widget lies between this widget's current position and its new end position.
                // Recurse to push it out of the way, and if that fails then the whole operation fails.
                const gapSize = j - (widget.x + widget.width);

                // NEXT: Heuristic to immediately cancel move if delta - gapSize > available space. Use #countSetBits for this

                if(!this.#prepareMoveWidgetX(cell, delta - gapSize, operationMap)) {
                    return false;
                }
                // We can move the colliding widget, we don't need to check this row any further as the move
                // handles any subsequent collisions.
                break;
            }
        }

        // The move is possible. Add the operation to the accumulator so we can carry them out if all are OK.
        const operation = {
            widget,
            oldX: widget.x,
            newX: widget.x,
            oldY: widget.y,
            newY: finalStartY
        };

        operationMap.set(widget, operation);

        return true;
    }

    removeWidget(widget: FlexiWidgetController): boolean {
        // Refer to the widget's state to find where it is in the grid.
        const [cellX, cellY] = [widget.x, widget.y];

        // Remove the widget from the layout.
        for(let i = cellX; i < cellX + widget.width; i++) {
            for(let j = cellY; j < cellY + widget.height; j++) {
                this.#layout[j][i] = null;
            }
        }

        this.#widgets.delete(widget);

        const widgetXBitmap = this.#createWidgetBitmap(widget, cellX, widget.width);

        // Update the row bitmaps to reflect the widget's removal.
        for(let i = cellY; i < cellY + widget.height; i++) {
            this.#bitmaps[i] &= ~widgetXBitmap;
        }

        // If we now have empty rows or columns at the ends, remove them.
        this.#removeTrailingEmptyRows();
        this.#removeTrailingEmptyColumns();

        return true;
    }

    takeSnapshot(): FreeFormGridSnapshot {
        // Deep copy the layout array, storing only the widget IDs
        const layoutCopy = this.#layout.map(row => 
            row.map(cell => cell)
        );

        return {
            layout: layoutCopy,
            bitmaps: [...this.#bitmaps],
            rows: this.#rows,
            columns: this.#columns,
            widgets: Array.from(this.#widgets).map(widget => ({
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

        this.#rows = this.#targetConfig.baseRows ?? 1;
        this.#columns = this.#targetConfig.baseColumns ?? 1;

        this.#bitmaps = new Array(this.#rows).fill(0);

        this.#layout = new Array(this.#rows).fill(new Array(this.#columns).fill(null));
    }

    restoreFromSnapshot(snapshot: FreeFormGridSnapshot) {
        this.#layout = snapshot.layout;
        this.#bitmaps = snapshot.bitmaps;
        this.#rows = snapshot.rows;
        this.#columns = snapshot.columns;

        this.#widgets.clear();
        for(const widget of snapshot.widgets) {
            this.#widgets.add(widget.widget);
            widget.widget.setBounds(widget.x, widget.y, widget.width, widget.height);
        }
    }

    mapRawCellToFinalCell(x: number, y: number): [number, number] {
        return [Math.floor(x), Math.floor(y)];
    }

    #doMoveOperation(widget: FlexiWidgetController, operation: MoveOperation) {
        const removedBitmaps = Array(widget.height).fill(0);

        // Remove the widget from the layout, if it's there.
        // Another move operation may have already replaced it here.
        for(let i = operation.oldY; i < operation.oldY + widget!.height; i++) {
            for(let j = operation.oldX; j < operation.oldX + widget!.width; j++) {
                if(this.#layout[i][j] === widget) {
                    this.#layout[i][j] = null;

                    removedBitmaps[i - operation.oldY] |= (1 << j);
                }
            }
        }

        // Update the bitmaps to reflect the widget's removal, again, only where this widget was removed.
        for(let i = operation.oldY; i < operation.oldY + widget!.height; i++) {
            this.#bitmaps[i] &= ~removedBitmaps[i - operation.oldY];
        }

        // Place the widget in the new position.
        for(let i = operation.newY; i < operation.newY + widget!.height; i++) {
            for(let j = operation.newX; j < operation.newX + widget!.width; j++) {
                this.#layout[i][j] = widget;
            }
        }

        widget.setBounds(operation.newX, operation.newY, widget.width, widget.height);

        // With the new bounds, update the row and column bitmaps to reflect the widget's placement.
        const rowBitmap = this.#createWidgetBitmap(widget, operation.newX, widget!.width);
        
        for(let i = operation.newY; i < operation.newY + widget!.height; i++) {
            this.#bitmaps[i] |= rowBitmap;
        }
    }

    #countSetBits(bitmap: number): number {
        // Uses Brian Kernighan's algorithm
        let count = 0;

        while(bitmap) {
            bitmap &= bitmap - 1;
            count++;
        }
        return count;
    }

    #createWidgetBitmap(widget: FlexiWidgetController, start: number, length: number): number {
        // Create a bitmap with 1s for the width of the widget starting at the given position
        let bitmap = 0;
        
        // Set bits from start to start + length
        for (let i = start; i < start + length; i++) {
            bitmap |= (1 << i);
        }
        
        return bitmap;
    }

    #tryExpandColumns(count: number) {
        if(!this.#layoutConfig.expandColumns || count > MAX_COLUMNS) {
            return false;
        }

        this.#columns = count;
        this.#layout.forEach(row => row.push(...new Array(count - this.#columns).fill(null)));
        return true;
    }

    #tryExpandRows(count: number) {
        if(!this.#layoutConfig.expandRows) {
            return false;
        }

        this.#rows = count;
        this.#bitmaps.push(...new Array(count - this.#rows).fill(0));
        this.#layout.push(...new Array(count - this.#rows).fill(new Array(this.#columns).fill(null)));
        return true;
    }

    #removeTrailingEmptyRows() {
        const minRows = this.#layoutConfig.minRows ?? 1;

        for(let i = this.#rows - 1; i >= minRows; i--) {
            if(this.#bitmaps[i]) {
                break;
            }

            this.#bitmaps.pop();
            this.#layout.pop();
            this.#rows--;
        }
    }

    #removeTrailingEmptyColumns() {
        const minColumns = this.#layoutConfig.minColumns ?? 1;

        for(let i = this.#columns - 1; i >= minColumns; i--) {
            // If the ith bit is set on this column in any row, then it can't be removed.
            const columnHasContent = this.#bitmaps.some(rowBitmap => {
                return (rowBitmap & (1 << i)) !== 0;
            });

            if(columnHasContent) {
                break;
            }

            // Remove the last column from each row
            this.#layout.forEach(row => row.pop());
            this.#columns--;
        }
    }

    // Getters and setters

    get layout() {
        return this.#state.layout;
    }

    get #layout() {
        return this.#state.layout;
    }

    set #layout(value: FlexiGridLayout) {
        this.#state.layout = value;
    }

    get bitmaps() {
        return this.#state.bitmaps;
    }

    get #bitmaps() {
        return this.#state.bitmaps;
    }

    set #bitmaps(value: number[]) {
        this.#state.bitmaps = value;
    }

    get rows() {
        return this.#state.rows;
    }

    set rows(value: number) {
        this.#state.rows = value;
    }

    get #rows() {
        return this.#state.rows;
    }

    set #rows(value: number) {
        this.#state.rows = value;
    }

    get columns() {
        return this.#state.columns;
    }

    get #columns() {
        return this.#state.columns;
    }

    set #columns(value: number) {
        this.#state.columns = value;
    }
}

/**
 * Flow-based FlexiGrid Layout
 * 
 * A grid layout where widgets are placed using a flow strategy. The flow axis determines which axis the widgets are placed along,
 * and the cross axis can be configured to expand when the flow axis is full.
 */
export class FlowFlexiGrid extends FlexiGrid {
    #targetConfig: FlexiTargetConfiguration = $state() as FlexiTargetConfiguration;
    #rawLayoutConfig: FlowTargetLayout = $derived(this.#targetConfig?.layout) as FlowTargetLayout;

    #state: FlexiFlowGridState = $state({
        rows: 0,
        columns: 0,
        widgets: [],
    });

    #layoutConfig: FlowTargetLayout = $derived({
        type: "flow",
        maxFlowAxis: this.#rawLayoutConfig.maxFlowAxis ?? Infinity,
        flowAxis: untrack(() => this.#rawLayoutConfig.flowAxis) ?? "row",
        placementStrategy: this.#rawLayoutConfig.placementStrategy ?? "append",
        disallowInsert: this.#rawLayoutConfig.disallowInsert ?? false,
        disallowExpansion: this.#rawLayoutConfig.disallowExpansion ?? false
    });

    constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
        super(target, targetConfig);

        this.#targetConfig = targetConfig;

        this.#rows = this._targetConfig.baseRows ?? 1;
        this.#columns = this._targetConfig.baseColumns ?? 1;
    }

    tryPlaceWidget(widget: FlexiWidgetController, cellX?: number, cellY?: number, width?: number, height?: number): boolean {
        const isRowFlow = this.#isRowFlow;

        width ??= 1;
        height ??= 1;

        // If the coordinate for the non-extending axis is greater than the axis's length, then this operation fails.
        if(isRowFlow && cellX !== undefined && cellX > this.columns) {
            return false;
        } else if(!isRowFlow && cellY !== undefined && cellY > this.rows) {
            return false;
        }

        let cellPosition: number | null = null;
        
        if(cellX !== undefined && cellY !== undefined && !this.#layoutConfig.disallowInsert) {
            // Ensures that it doesn't try to place a widget too far along or down.
            cellX = Math.min(cellX, this.columns);
            cellY = Math.min(cellY, this.rows);

            cellPosition = this.#convert2DPositionTo1D(cellX, cellY);
        }
        // If it's null then coordinate is missing, or we can't allow insertion. Replace coordinates based on the placement strategy.
        cellPosition ??= this.#resolveNextPlacementPosition();

        // If the width/height of the widget is greater than the flow axis' length, then constrain it to the flow axis' length.
        if(isRowFlow && width > this.columns) {
            width = this.columns;
        } else if(!isRowFlow && height > this.rows) {
            height = this.rows;
        }

        // Find the nearest widget to the proposed position, and determine the precise location based on it. 
        const [index, nearestWidget] = this.#findNearestWidget(cellPosition, 0, this.#widgets.length - 1);

        // Easy - no widgets to search and none to shift. Just add ours at the start.
        if(!nearestWidget) {
            this.#widgets.push(widget);
            widget.setBounds(0, 0, width, height);
            return true;
        }

        const nearestWidgetPosition = this.#convert2DPositionTo1D(nearestWidget.x, nearestWidget.y);

        const operations: MoveOperation[] = [];

        // If the found widget is to the left of the proposed position, then our widget will immediately succeed it.
        if(nearestWidgetPosition < cellPosition) {
            const cellPosition = nearestWidgetPosition + this.#getNonFlowLength(nearestWidget);

            // Prepare to shift the remaining widgets to the right.
            if(!this.#moveAndShiftWidgets(index + 1, cellPosition, operations)) {
                return false;
            }

            // If this widget has placed itself at the end, then we need to make sure the flow axis fits it.
            if(index + 1 === this.#widgets.length) {
                if(isRowFlow && Math.floor(cellPosition / this.columns) >= this.rows) {
                    const newRows = Math.floor(cellPosition / this.columns) + 1;
                    if(newRows > this.#maxFlowAxis) {
                        return false;
                    }

                    this.#rows = newRows;
                } else {
                    const newColumns = Math.floor(cellPosition / this.rows) + 1;
                    if(newColumns > this.#maxFlowAxis) {
                        return false;
                    }

                    this.#columns = newColumns;
                }
            }
            this.#widgets.splice(index + 1, 0, widget);
        // Otherwise, our widget will immediately precede it and shift it along.
        } else if(nearestWidgetPosition >= cellPosition) {
            // Prepare to shift the remaining widgets to the right.
            if(!this.#moveAndShiftWidgets(index, nearestWidgetPosition + this.#getNonFlowLength(widget), operations)) {
                return false;
            }
            this.#widgets.splice(index, 0, widget);
        }

        // Carry out the operations, as they all cleared.
        for(const operation of operations) {
            operation.widget.setBounds(operation.newX, operation.newY, isRowFlow ? operation.widget.width : 1, isRowFlow ? 1 : operation.widget.height);
        }

        // Finally, add the widget to the grid.
        const [newX, newY] = this.#convert1DPositionTo2D(cellPosition);
        widget.setBounds(newX, newY, isRowFlow ? 1 : width, isRowFlow ? height : 1);

        return true;
    }

    #resolveNextPlacementPosition(): number {
        if(!this.#widgets.length) {
            return 0;
        }

        switch(this.#layoutConfig.placementStrategy) {
            case "prepend":
            {
                return 0;
            }
            case "append":
            {
                // Find the last widget and place it after it.
                const lastWidget = this.#widgets[this.#widgets.length - 1];

                return this.#convert2DPositionTo1D(lastWidget.x, lastWidget.y) + this.#getNonFlowLength(lastWidget);
            }
        }
    }

    removeWidget(widget: FlexiWidgetController): boolean {
        const widgetPosition = this.#convert2DPositionTo1D(widget.x, widget.y);

        // Find the widget in the grid.
        const [index, foundWidget] = this.#findNearestWidget(widgetPosition, 0, this.#widgets.length - 1);

        if(foundWidget !== widget) {
            return false;
        }

        // Remove the widget from the grid.
        this.#widgets.splice(index, 1);

        const operations: MoveOperation[] = [];

        // Shift the remaining widgets to the left if possible.
        if(!this.#moveAndShiftWidgets(index, widgetPosition, operations)) {
            return false;
        }

        // Carry out the operations, as they all cleared.
        for(const operation of operations) {
            operation.widget.setBounds(operation.newX, operation.newY, widget.width, widget.height);
        }

        // Shrink the grid if necessary.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, lastWidget] = this.#findNearestWidget(Infinity, 0, this.#widgets.length - 1);

        if(lastWidget) {
            if(this.#layoutConfig.flowAxis === "row" && this.rows > lastWidget.y + lastWidget.height) {
                this.#rows = lastWidget.y + lastWidget.height;
            } else if(this.#layoutConfig.flowAxis === "column" && this.columns > lastWidget.x + lastWidget.width) {
                this.#columns = lastWidget.x + lastWidget.width;
            }
        } else {
            this.#rows = 1;
            this.#columns = 1;
        }

        return true;
    }

    clear() {
        // Clear the grid without replacing it outright so reactivity proxies are preserved.
        this.#widgets.length = 0;
    }

    takeSnapshot(): FlowGridSnapshot {
        // Copy the widget positions and sizes.
        const widgets = this.#widgets.map(widget => {
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
            rows: this.#rows,
            columns: this.#columns
        };
    }

    restoreFromSnapshot(snapshot: FlowGridSnapshot): void {
        this.clear();

        for(const widget of snapshot.widgets) {
            widget.widget.setBounds(widget.x, widget.y, widget.width, widget.height);
            this.#widgets.push(widget.widget);
        }

        this.#rows = snapshot.rows;
        this.#columns = snapshot.columns;
    }

    mapRawCellToFinalCell(x: number, y: number): [number, number] {
        const position = [Math.round(x), Math.round(y)];

        const position1D = this.#convert2DPositionTo1D(position[0], position[1]);

        const [index, nearest] = this.#findNearestWidget(position1D, 0, this.#widgets.length - 1);

        if(nearest?.isShadow) {
            return [nearest.x, nearest.y];
        }

        if(index == 0) {
            return [position[0], position[1]];
        }

        const predecessor = this.#widgets[index - 1];

        if(predecessor.isShadow) {
            return [predecessor.x, predecessor.y];
        }

        return [position[0], position[1]];
    }

    #findNearestWidget(position: number, searchStart: number, searchEnd: number): [number, FlexiWidgetController | null] {
        if(this.#widgets.length === 0) {
            return [0, null];
        }
    
        if(searchStart === searchEnd) {
            return [searchStart, this.#widgets[searchStart]];
        }
    
        const median = Math.floor((searchStart + searchEnd) / 2);
        const widget = this.#widgets[median];
    
        const widgetValue = this.#convert2DPositionTo1D(widget.x, widget.y);
    
        if(widgetValue === position) {
            return [median, widget];
        } else if(widgetValue < position) {
            return this.#findNearestWidget(position, median + 1, searchEnd);
        } else {
            return this.#findNearestWidget(position, searchStart, median);
        }
    }

    #moveAndShiftWidgets(startIndex: number, basePosition: number, operations: MoveOperation[]): boolean {
        if(startIndex >= this.#widgets.length) {
            return true;
        }

        let lastPosition = basePosition;

        for(let i = startIndex; i < this.#widgets.length; i++) {
            const widget = this.#widgets[i];

            const [newX, newY] = this.#convert1DPositionTo2D(lastPosition);

            if(newY >= this.rows && !this.#tryExpandRows(newY + 1)) {
                return false;
            }
            if(newX >= this.columns && !this.#tryExpandColumns(newX + 1)) {
                return false;
            }

            operations.push({
                widget,
                oldX: widget.x,
                oldY: widget.y,
                newX,
                newY
            });

            lastPosition = lastPosition + this.#getNonFlowLength(widget);
        }

        return true;
    }

    #convert2DPositionTo1D(x: number, y: number): number {
        if(this.#isRowFlow) {
            return y * this.columns + x;
        }

        return x * this.rows + y;
    }

    #convert1DPositionTo2D(index: number): [number, number] {
        if(this.#isRowFlow) {
            return [index % this.columns, Math.floor(index / this.columns)];
        }

        return [Math.floor(index / this.rows), index % this.rows];
    }

    #getNonFlowLength(widget: FlexiWidgetController): number {
        if(this.#isRowFlow) {
            return widget.width;
        }

        return widget.height;
    }

    #tryExpandColumns(newCount: number): boolean {
        if(this.#layoutConfig.disallowExpansion || newCount > this.#maxFlowAxis || this.#isRowFlow) {
            return false;
        }

        this.#columns = newCount;
        return true;
    }

    #tryExpandRows(newCount: number): boolean {
        if(this.#layoutConfig.disallowExpansion || newCount > this.#maxFlowAxis || !this.#isRowFlow) {
            return false;
        }

        this.#rows = newCount;
        return true;
    }

    get rows(): number {
        return this.#state.rows;
    }
    get columns(): number {
        return this.#state.columns;
    }

    get #rows(): number {
        return this.#state.rows;
    }
    set #rows(value: number) {
        this.#state.rows = value;
    }
    get #columns(): number {
        return this.#state.columns;
    }
    set #columns(value: number) {
        this.#state.columns = value;
    }

    get widgets(): FlexiWidgetController[] {
        return this.#state.widgets;
    }
    get #widgets(): FlexiWidgetController[] {
        return this.#state.widgets;
    }
    set #widgets(value: FlexiWidgetController[]) {
        this.#state.widgets = value;
    }

    get #isRowFlow(): boolean {
        return this.#layoutConfig.flowAxis === "row";
    }

    get #maxFlowAxis(): number {
        return this.#layoutConfig.maxFlowAxis!;
    }
}

type FlexiFreeFormGridState = {
    rows: number;
    columns: number;
    layout: FlexiGridLayout;
    bitmaps: number[];
}

type FlexiFlowGridState = {
    rows: number;
    columns: number;
    widgets: FlexiWidgetController[];
}

const contextKey = Symbol('flexigrid');

export function flexigrid() {
    const target = getInternalFlexitargetCtx();

    if(!target) {
        throw new Error("A FlexiGrid was instantiated outside of a FlexiTarget context. Ensure that flexigrid() is called within a FlexiTarget component.");
    }

    const grid = target.createGrid();
    setContext(contextKey, grid);

    // Tell the grid's dimension tracker to watch the grid element.
    $effect(() => {
        grid.watchGridElementDimensions();
    })

    return {
        grid
    };
}

export function getFlexigridCtx() {
    return getContext<FlexiGrid | undefined>(contextKey);
}