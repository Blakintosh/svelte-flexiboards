import type { FlexiWidget } from "./widget.svelte.js";
import type { FlowTargetLayout as FlowTargetLayout, FlexiTargetConfiguration, FreeFormTargetLayout as FreeFormTargetLayout } from "./types.js";
import { setContext } from "svelte";
import { getContext } from "svelte";
import type { FlexiTarget } from "./target.svelte.js";
import { getFlexitargetCtx } from "./target.svelte.js";

type FlexiGridLayout = (FlexiWidget | null)[][];

export type MoveOperation = {
    widget: FlexiWidget;
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
    widget: FlexiWidget;
    x: number;
    y: number;
    width: number;
    height: number;
}

const MAX_COLUMNS = 32;

export abstract class FlexiGrid {
    abstract tryPlaceWidget(widget: FlexiWidget, cellX?: number, cellY?: number): boolean;
    abstract removeWidget(widget: FlexiWidget): boolean;
    abstract takeSnapshot(): unknown;
    abstract restoreFromSnapshot(snapshot: unknown): void;

    _target: FlexiTarget;
    _targetConfig: FlexiTargetConfiguration;

    mouseCellPosition: { x: number, y: number } = $state({
        x: 0,
        y: 0
    });


	#ref: { ref: HTMLElement | null } = $state({ ref: null });

    constructor(target: FlexiTarget, targetConfig: FlexiTargetConfiguration) {
        this._target = target;
        this._targetConfig = targetConfig;

        this.onpointermove = this.onpointermove.bind(this);

        $effect(() => {
            window.addEventListener('pointermove', this.onpointermove);

            return () => {
                window.removeEventListener('pointermove', this.onpointermove);
            };
        });
    }

    style: string = $derived.by(() => {
        return `display: grid; grid-template-columns: repeat(${this.columns}, minmax(0, 1fr)); grid-template-rows: repeat(${this.rows}, minmax(0, 1fr));`;
    });

    #updatePointerPosition(clientX: number, clientY: number) {
        if (!this.ref) {
            return;
        }

        const rect = this.ref.getBoundingClientRect();

        // Get position relative to grid element
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        // Calculate size of each grid cell
        const unitX = rect.width / this.columns;
        const unitY = rect.height / this.rows;

        // Convert to grid cell indices
        const cellX = Math.min(Math.max(0, Math.floor(relativeX / unitX)), this.columns - 1);
        const cellY = Math.min(Math.max(0, Math.floor(relativeY / unitY)), this.rows - 1);

        this.mouseCellPosition.x = cellX;
        this.mouseCellPosition.y = cellY;

        this._target.onmousegridcellmove({
            cellX,
            cellY
        });
    }

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
    #widgets: Set<FlexiWidget> = new Set();

    #state: FlexiFreeFormGridState = $state({
        rows: 0,
        columns: 0,
        layout: [],
        bitmaps: []
    });

    #layoutConfig: FreeFormTargetLayout;

    constructor(target: FlexiTarget, targetConfig: FlexiTargetConfiguration, layoutConfig: FreeFormTargetLayout) {
        super(target, targetConfig);

        this.#layoutConfig = layoutConfig;

        this.#rows = targetConfig.minRows ?? 1;
        this.#columns = targetConfig.minColumns ?? 1;

        this.#bitmaps = new Array(this.#rows).fill(0);

        this.#layout = new Array(this.#rows).fill(new Array(this.#columns).fill(null));
    }

    tryPlaceWidget(widget: FlexiWidget, cellX?: number, cellY?: number): boolean {
        // Need both coordinates to place a widget.
        if(cellX === undefined || cellY === undefined) {
            throw new Error("Missing required x and y fields for a widget in a sparse target layout. The x- and y- coordinates of a widget cannot be automatically inferred in this context.");
        }

        // When placing a widget, we should constrain it so that it can only make so many more columns/rows more than the current grid size.
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
                const moveBy = (cellX + widget.width) - collidingWidget.x;

                if(!this.#prepareMoveWidgetX(collidingWidget, moveBy, operations)) {
                    // TODO: If moving along the x-axis is not possible, we then want to try via the y-axis.
                    // If that's not possible either, then the overall operation is not possible.
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

    #prepareMoveWidgetX(widget: FlexiWidget, delta: number, operationMap: Map<FlexiWidget, MoveOperation>): boolean {
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

    #doMoveOperation(widget: FlexiWidget, operation: MoveOperation) {
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
        const minRows = this._targetConfig.minRows ?? 1;

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
        const minColumns = this._targetConfig.minColumns ?? 1;

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
    #layoutConfig: FlowTargetLayout;
    #maxFlowAxis: number;
    #flowAxis: "row" | "column";
    #isRowFlow: boolean;

    #state: FlexiFlowGridState = $state({
        rows: 0,
        columns: 0,
        widgets: []
    });

    constructor(target: FlexiTarget, targetConfig: FlexiTargetConfiguration, layoutConfig: FlowTargetLayout) {
        super(target, targetConfig);

        this.#layoutConfig = layoutConfig;
        // TODO: not reactive - don't see why it should be
        this.#maxFlowAxis = layoutConfig.maxFlowAxis ?? Infinity;
        this.#flowAxis = layoutConfig.flowAxis ?? "row";
        this.#isRowFlow = this.#flowAxis === "row";
        this.#rows = this._targetConfig.minRows ?? 1;
        this.#columns = this._targetConfig.minColumns ?? 1;
    }

    tryPlaceWidget(widget: FlexiWidget, cellX?: number, cellY?: number): boolean {
        const isRowFlow = this.#isRowFlow;

        // If the coordinate for the non-extending axis is greater than the axis's length, then this operation fails.
        if(isRowFlow && cellX !== undefined && cellX > this.columns) {
            return false;
        } else if(!isRowFlow && cellY !== undefined && cellY > this.rows) {
            return false;
        }

        let cellPosition: number | null = null;
        
        if(cellX !== undefined && cellY !== undefined && !this.#layoutConfig.disallowInsert) {
            cellPosition = this.#convert2DPositionTo1D(cellX, cellY);
        }
        // If it's null then coordinate is missing, or we can't allow insertion. Replace coordinates based on the placement strategy.
        cellPosition ??= this.#resolveNextPlacementPosition();

        // If the width/height of the widget is greater than the flow axis' length, then constrain it to the flow axis' length.
        if(isRowFlow && widget.width > this.columns) {
            widget.width = this.columns;
        } else if(!isRowFlow && widget.height > this.rows) {
            widget.height = this.rows;
        }

        // Find the nearest widget to the proposed position, and determine the precise location based on it. 
        const [index, nearestWidget] = this.#findNearestWidget(cellPosition, 0, this.#widgets.length - 1);

        // Easy - no widgets to search and none to shift. Just add ours at the start.
        if(!nearestWidget) {
            this.#widgets.push(widget);
            widget.setBounds(0, 0, widget.width, widget.height);
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
        widget.setBounds(newX, newY, isRowFlow ? 1 : widget.width, isRowFlow ? widget.height : 1);

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

    removeWidget(widget: FlexiWidget): boolean {
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
        // Clear the grid without replacing it outright so reactivity proxies are preserved.
        this.#widgets.length = 0;

        for(const widget of snapshot.widgets) {
            widget.widget.setBounds(widget.x, widget.y, widget.width, widget.height);
            this.#widgets.push(widget.widget);
        }

        this.#rows = snapshot.rows;
        this.#columns = snapshot.columns;
    }

    #findNearestWidget(position: number, searchStart: number, searchEnd: number): [number, FlexiWidget | null] {
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

    #getNonFlowLength(widget: FlexiWidget): number {
        if(this.#isRowFlow) {
            return widget.width;
        }

        return widget.height;
    }

    #tryExpandColumns(newCount: number): boolean {
        if(this.#layoutConfig.disallowExpansion || newCount > this.#maxFlowAxis) {
            return false;
        }

        this.#columns = newCount;
        return true;
    }

    #tryExpandRows(newCount: number): boolean {
        if(this.#layoutConfig.disallowExpansion || newCount > this.#maxFlowAxis) {
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

    get widgets(): FlexiWidget[] {
        return this.#state.widgets;
    }
    get #widgets(): FlexiWidget[] {
        return this.#state.widgets;
    }
    set #widgets(value: FlexiWidget[]) {
        this.#state.widgets = value;
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
    widgets: FlexiWidget[];
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
        grid
    };
}

function getFlexigridCtx() {
    return getContext<FlexiGrid | undefined>(contextKey);
}

export {
    type FreeFormGridSnapshot as GridSnapshot,
    type WidgetSnapshot,
    flexigrid,
    getFlexigridCtx
};