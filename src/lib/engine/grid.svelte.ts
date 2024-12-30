import type { FlexiWidget } from "./widget.svelte.js";
import type { FlexiTargetConfiguration, WidgetDroppedEvent } from "./types.js";
import { setContext } from "svelte";
import { getContext } from "svelte";
import type { FlexiTarget } from "./target.svelte.js";
import { getFlexitargetCtx } from "./target.svelte.js";

type FlexiGridLayout = (FlexiWidget | null)[][];

// type GridEntry = {
//     widget: FlexiWidget | null;
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//     next?: GridEntry;
// }

type MoveOperation = {
    widget: FlexiWidget;
    newX: number;
    newY: number;
    oldX: number;
    oldY: number;
}

type GridSnapshot = {
    layout: FlexiGridLayout;
    bitmaps: number[];
    rows: number;
    columns: number;
    widgets: WidgetSnapshot[];
}

type WidgetSnapshot = {
    widget: FlexiWidget;
    x: number;
    y: number;
    width: number;
    height: number;
}

const MAX_COLUMNS = 32;

export class FlexiGrid {
    #widgets: Set<FlexiWidget> = new Set();
    
	#ref: { ref: HTMLElement | null } = $state({ ref: null});

    #state: FlexiGridState = $state({
        rows: 0,
        columns: 0,
        layout: [],
        bitmaps: []
    });

    // TODO: Will never update to reflect state changes, nor will it propagate defaults from the provider.
    #targetConfig: FlexiTargetConfiguration;

    #target: FlexiTarget;

    #position: { x: number, y: number } = $state({
        x: 0,
        y: 0
    });

    constructor(target: FlexiTarget, targetConfig: FlexiTargetConfiguration) {
        this.#target = target;
        this.#targetConfig = targetConfig;

        this.#rows = targetConfig.rows ?? 1;
        this.#columns = targetConfig.columns ?? 1;
        
        this.#bitmaps = new Array(this.#rows).fill(0);

        this.onmousemove = this.onmousemove.bind(this);

        this.#layout = new Array(this.#rows).fill(new Array(this.#columns).fill(null));
    }

    style: string = $derived.by(() => {
        return `grid-template-columns: repeat(${this.columns}, minmax(0, 1fr)); grid-template-rows: repeat(${this.rows}, minmax(0, 1fr));`;
    });

    onmousemove(event: MouseEvent) {
        if (!this.#ref.ref) return;
        
        const rect = this.#ref.ref.getBoundingClientRect();
        
        // Get position relative to grid element
        const relativeX = event.clientX - rect.left;
        const relativeY = event.clientY - rect.top;

        // Calculate size of each grid cell
        const unitX = rect.width / this.#columns;
        const unitY = rect.height / this.#rows;

        // Convert to grid cell indices
        const cellX = Math.min(Math.max(0, Math.floor(relativeX / unitX)), this.#columns - 1);
        const cellY = Math.min(Math.max(0, Math.floor(relativeY / unitY)), this.#rows - 1);

        const changed = cellX !== this.#position.x || cellY !== this.#position.y;

        this.#position.x = cellX;
        this.#position.y = cellY;

        if(changed) {
            this.#target.onmousegridcellmove({
                cellX,
                cellY
            });
        }
    }

    tryPlaceWidget(widget: FlexiWidget, cellX: number, cellY: number): boolean {
        // When placing a widget, we should constrain it so that it can only make so many more columns/rows more than the current grid.
        if(cellX >= this.#columns) {
            cellX = this.#columns - 1;
        }
        if(cellY >= this.#rows) {
            cellY = this.#rows - 1;
        }

        const widgetXBitmap = this.#createWidgetBitmap(widget, cellX, widget.width);

        const endCellX = cellX + widget.width;
        const endCellY = cellY + widget.height;

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
        const operations: Map<FlexiWidget, MoveOperation> = new Map();

        // Looking row-by-row, we can identify collisions using the bitmaps.
        for(let i = cellY; i < cellY + widget.height; i++) {
            // Expand rows as necessary if this operation is supported.
            // TODO: If we guarantee that insertion position can only be one higher than the current row,
            // we can avoid this.
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
            for(let j = cellX; j < cellX + widget.width; j++) { 
                const collidingWidget = this.#layout[i][j];

                if(!collidingWidget) {
                    continue;
                }
                console.log("colliding widget at ", i, j);
                const moveBy = (cellX + widget.width) - collidingWidget.x;
                console.log("will ask to move by: ", moveBy);

                if(!this.prepareMoveWidgetX(collidingWidget, moveBy, operations)) {
                    // TODO: If moving along the x-axis is not possible, we then want to try via the y-axis.
                    // If that's not possible either, then the overall operation is not possible.
                    console.log("move not possible")
                    return false;
                }
                // Don't need to do this again for this row.
                break;
            }
        }

        // Apply all other necessary move operations.
        for(const operation of operations.values()) {
            console.log("move to ", operation.newX, operation.newY);
            this.#doMoveOperation(operation.widget, operation);
        }

        // No collisions, or we resolved them. Place the widget.
        for(let i = cellX; i < cellX + widget.width; i++) {
            for(let j = cellY; j < cellY + widget.height; j++) {
                this.#layout[j][i] = widget;
            }
        }

        this.#widgets.add(widget);

        // Update the row bitmaps to reflect the widget's placement.
        for(let i = cellY; i < cellY + widget.height; i++) {
            this.#bitmaps[i] |= widgetXBitmap;
        }

        widget.setBounds(cellX, cellY, widget.width, widget.height);

        return true;
    }

    prepareMoveWidgetX(widget: FlexiWidget, delta: number, operationMap: Map<FlexiWidget, MoveOperation>): boolean {
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
                const gapSize = j - (widget.x + widget.width);

                // TODO: Heuristic to immediately cancel move if delta - gapSize > available space.

                console.log("Recursing to move widget ", " by ", delta - gapSize);
                console.log("Is widget self? ", cell === widget);
                // TODO: Why is it colliding with itself? It shouldn't be in the grid at this point.
                if(!this.prepareMoveWidgetX(cell, delta - gapSize, operationMap)) {
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

    removeWidget(widget: FlexiWidget): boolean {
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

    takeSnapshot(): GridSnapshot {
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

    restoreFromSnapshot(snapshot: GridSnapshot) {
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

    #doMoveOperation(widget: FlexiWidget, operation: MoveOperation) {
        const removedBitmaps = Array(widget.height).fill(0);

        // Remove the widget from the layout, if it's there.
        // Another move operation may have already replaced it here.
        for(let i = operation.oldY; i < operation.oldY + widget!.height; i++) {
            for(let j = operation.oldX; j < operation.oldX + widget!.width; j++) {
                if(this.#layout[i][j] === widget) {
                    this.#layout[i][j] = null;

                    removedBitmaps[i - operation.oldY] |= (1 << j);

                    console.log("row bitmap at ", i, " is ", this.#bitmaps[i].toString(2).padStart(32, '0'));
                    console.log("removed row bitmap at ", i, " is ", removedBitmaps[i - operation.oldY].toString(2).padStart(32, '0'));
                }
            }
        }

        // Update the bitmaps to reflect the widget's removal, again, only where this widget was removed.
        for(let i = operation.oldY; i < operation.oldY + widget!.height; i++) {
            console.log("removing row bitmap at ", i);
            console.log("bitmap: ", this.#bitmaps[i]);
            console.log("removed: ", removedBitmaps[i - operation.oldY]);
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

    #createWidgetBitmap(widget: FlexiWidget, start: number, length: number): number {
        // Create a bitmap with 1s for the width of the widget starting at the given position
        let bitmap = 0;
        
        // Set bits from start to start + length
        for (let i = start; i < start + length; i++) {
            bitmap |= (1 << i);
        }
        
        return bitmap;
    }

    #tryExpandColumns(count: number) {
        console.log("try expand columns? to ", count);
        if(!this.#targetConfig.expandColumns || count > MAX_COLUMNS) {
            console.log("not allowed")
            return false;
        }

        this.#columns = count;
        console.log("columns is now ", this.#columns);
        this.#layout.forEach(row => row.push(...new Array(count - this.#columns).fill(null)));
        return true;
    }

    #tryExpandRows(count: number) {
        console.log("try expand rows? to ", count);
        if(!this.#targetConfig.expandRows) {
            console.log("not allowed")
            return false;
        }

        this.#rows = count;
        this.#bitmaps.push(...new Array(count - this.#rows).fill(0));
        this.#layout.push(...new Array(count - this.#rows).fill(new Array(this.#columns).fill(null)));
        return true;
    }

    #removeTrailingEmptyRows() {
        const minRows = this.#targetConfig.rows ?? 1;

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
        const minColumns = this.#targetConfig.columns ?? 1;

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

	set ref(ref: HTMLElement | null) {
		this.#ref.ref = ref;
	}

    get mouseCellPosition() {
        return this.#position;
    }
}

type FlexiGridState = {
    rows: number;
    columns: number;
    layout: FlexiGridLayout;
    bitmaps: number[];
}

const contextKey = Symbol('flexigrid');

function flexigrid() {
    const target = getFlexitargetCtx();

    if(!target) {
        throw new Error("A FlexiGrid was instantiated outside of a FlexiTarget context. Ensure that flexigrid() is called within a FlexiTarget component.");
    }

    const grid = target.createGrid();
    setContext(contextKey, grid);

    return {
        grid,
        onmousemove: (event: MouseEvent) => grid.onmousemove(event)
    };
}

function getFlexigridCtx() {
    return getContext<FlexiGrid | undefined>(contextKey);
}

export {
    type GridSnapshot,
    type WidgetSnapshot,
    flexigrid,
    getFlexigridCtx
};