
import { setContext, untrack } from "svelte";
import { getContext } from "svelte";
import type { InternalFlexiTargetController, FlexiTargetConfiguration, TargetSizing } from "../target.svelte.js";
import { getInternalFlexitargetCtx } from "../target.svelte.js";
import { GridDimensionTracker } from "../utils.svelte.js";
import type { FlexiWidgetController } from "../widget.svelte.js";

type FlexiGridLayout = (FlexiWidgetController | null)[][];

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

export type WidgetSnapshot = {
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

type FlexiFreeFormGridState = {
    rows: number;
    columns: number;
    layout: FlexiGridLayout;
    bitmaps: number[];
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