import { untrack } from "svelte";
import { FlexiGrid, type MoveOperation, type WidgetSnapshot } from "./base.svelte.js";
import type { FlexiWidgetController } from "../widget.svelte.js";
import type { FlexiTargetConfiguration, InternalFlexiTargetController } from "../target.svelte.js";

/**
 * The layout configuration for a flow layout based grid.
 */
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

type FlowMoveOperation = {
    widget: FlexiWidgetController;
    newPosition: number;
}

/**
 * Flow-based FlexiGrid Layout
 * 
 * A grid layout where widgets are placed using a flow strategy. The flow axis determines which axis the widgets are placed along,
 * and the cross axis can be configured to expand when the flow axis is full.
 * @internal
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

    #coordinateSystem: FlowGridCoordinateSystem = new FlowGridCoordinateSystem(this);

    constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
        super(target, targetConfig);

        this.#targetConfig = targetConfig;

        this.rows = this._targetConfig.baseRows ?? 1;
        this.columns = this._targetConfig.baseColumns ?? 1;
    }

    tryPlaceWidget(widget: FlexiWidgetController, cellX?: number, cellY?: number, width: number = 1, height: number = 1): boolean {
        const isRowFlow = this.isRowFlow;

        // If the coordinate for the cross axis is greater than the axis's length, then this operation fails.
        if(!this.#coordinateSystem.coordinateFitsWithinCrossAxis(cellX, cellY)) {
            return false;
        }

        // Finalise where we're going to place the widget.
        const cellPosition = this.#getPlacementPosition(cellX, cellY);

        // If the width/height of the widget is greater than the flow axis' length, then constrain it to the flow axis' length.
        if(isRowFlow && width > this.columns) {
            width = this.columns;
        } else if(!isRowFlow && height > this.rows) {
            height = this.rows;
        }

        // Find the nearest widget to the proposed position, and determine the precise location based on it. 
        const [index, nearestWidget] = this.#coordinateSystem.findNearestWidget(cellPosition, 0, this.#widgets.length - 1);

        // If there's no widgets in the grid, just trivially add ours to the start.
        if(!nearestWidget) {
            return this.#placeWidgetAt(widget, 0, 0);
        }

        const nearestWidgetPosition = this.#coordinateSystem.to1D(nearestWidget.x, nearestWidget.y);

        // If the found widget's position is before our desired one, then our widget will be placed adjacent to it along the flow axis.
        if(nearestWidgetPosition < cellPosition) {
            return this.#placeWidgetAt(widget, nearestWidgetPosition + this.#coordinateSystem.getWidgetLength(nearestWidget), index + 1);
        }

        // Otherwise, it'll assume its position and shift it (and other widgets) along.
        return this.#placeWidgetAt(widget, nearestWidgetPosition, index);
    }

    #commitOperations(operations: FlowMoveOperation[]) {
        const isRowFlow = this.isRowFlow;

        for(const operation of operations) {
            const [newX, newY] = this.#coordinateSystem.to2D(operation.newPosition);
            operation.widget.setBounds(newX, newY, isRowFlow ? operation.widget.width : 1, isRowFlow ? 1 : operation.widget.height);
        }
        return true;
    }

    #placeWidgetAt(widget: FlexiWidgetController, position: number, index: number) {
        const operations: FlowMoveOperation[] = [];

        console.log("Placing widget at", position, "with index", index);
        this.#widgets.splice(index, 0, widget);
        if(!this.#shiftWidget(index, position, operations)) {
            // Undo the insertion.
            this.#widgets.splice(index, 1);

            return false;
        }

        return this.#commitOperations(operations);
    }

    #shiftWidget(index: number, position: number, operations: FlowMoveOperation[]): boolean {
        const widget = this.#widgets[index];
        const finalPosition = this.#coordinateSystem.findPositionToFitWidget(widget, position);

        console.log("Shifting widget at", index, "to", finalPosition);
        console.log("which in 2D is", this.#coordinateSystem.to2D(finalPosition));

        // Expand the grid if the widget is being added past the current flow axis end.
        if(!this.#coordinateSystem.expandIfNeededToFit(finalPosition)) {
            console.log("Failed to expand grid");
            return false;
        }

        operations.push({
            widget,
            newPosition: finalPosition
        });

        if(index + 1 >= this.#widgets.length) {
            console.log("Job done");
            return true;
        }

        console.log("Intention to shift widget at", index + 1, "to", finalPosition + this.#coordinateSystem.getWidgetLength(widget));
        // Prepare to shift the remaining widgets along relative to this one.
        return this.#shiftWidget(
            index + 1, 
            finalPosition + this.#coordinateSystem.getWidgetLength(widget), 
            operations
        );
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

                return this.#coordinateSystem.to1D(lastWidget.x, lastWidget.y) + this.#coordinateSystem.getWidgetLength(lastWidget);
            }
        }
    }

    #getPlacementPosition(cellX?: number, cellY?: number): number {
        // If insertion is not possible (or coordinates not provided), then automatically decide the position based on the placement strategy.
        if(cellX === undefined || cellY === undefined || this.#layoutConfig.disallowInsert) {
            return this.#resolveNextPlacementPosition();
        }

        // Otherwise, just ensure that the coordinates are within the grid's bounds.
        // TODO: this might be where we need to add the "wrap" logic.
        return this.#coordinateSystem.to1D(
            Math.min(cellX, this.columns), 
            Math.min(cellY, this.rows)
        );
    }

    removeWidget(widget: FlexiWidgetController): boolean {
        // Find the widget in the grid.
        const [index, foundWidget] = this.#coordinateSystem.findNearestWidgetFrom2D(widget.x, widget.y);

        if(foundWidget !== widget) {
            return false;
        }

        // Remove the widget from the grid.
        if(!this.#removeWidgetAt(index)) {
            return false;
        }

        // Shrink the grid if necessary.
        const [_, lastWidget] = this.#coordinateSystem.findNearestWidgetFrom2D(Infinity, Infinity);

        if(lastWidget) {
            if(this.#layoutConfig.flowAxis === "row" && this.rows > lastWidget.y + lastWidget.height) {
                this.rows = lastWidget.y + lastWidget.height;
            } else if(this.#layoutConfig.flowAxis === "column" && this.columns > lastWidget.x + lastWidget.width) {
                this.columns = lastWidget.x + lastWidget.width;
            }
        } else {
            this.rows = 1;
            this.columns = 1;
        }

        return true;
    }

    #removeWidgetAt(index: number) {
        const widget = this.#widgets[index];
        this.#widgets.splice(index, 1);

        const operations: FlowMoveOperation[] = [];
        const widgetPosition = this.#coordinateSystem.to1D(widget.x, widget.y);
        console.log("Removing widget at", index, "with position", widgetPosition);

        // Shift the remaining widgets back if possible.
        if(index < this.#widgets.length && !this.#shiftWidget(index, widgetPosition, operations)) {
            return false;
        }

        return this.#commitOperations(operations);
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
            rows: this.rows,
            columns: this.columns
        };
    }

    restoreFromSnapshot(snapshot: FlowGridSnapshot): void {
        this.clear();

        for(const widget of snapshot.widgets) {
            widget.widget.setBounds(widget.x, widget.y, widget.width, widget.height);
            this.#widgets.push(widget.widget);
        }

        this.rows = snapshot.rows;
        this.columns = snapshot.columns;
    }

    mapRawCellToFinalCell(x: number, y: number): [number, number] {
        const position = [Math.round(x), Math.round(y)];
        const [index, nearest] = this.#coordinateSystem.findNearestWidgetFrom2D(position[0], position[1]);

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

    get rows(): number {
        return this.#state.rows;
    }
    set rows(value: number) {
        this.#state.rows = value;
    }
    get columns(): number {
        return this.#state.columns;
    }
    set columns(value: number) {
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

    get isRowFlow(): boolean {
        return this.#layoutConfig.flowAxis === "row";
    }

    get maxFlowAxis(): number {
        return this.#layoutConfig.maxFlowAxis!;
    }
}

class FlowGridCoordinateSystem {
    #grid: FlowFlexiGrid = $state() as FlowFlexiGrid;
    #isRowFlow: boolean = $derived(this.#grid?.isRowFlow ?? false);

    #rows: number = $derived(this.#grid?.rows ?? 0);
    #columns: number = $derived(this.#grid?.columns ?? 0);
    #widgets: FlexiWidgetController[] = $derived(this.#grid?.widgets ?? []);

    constructor(grid: FlowFlexiGrid) {
        this.#grid = grid;
    }

    to1D(x: number, y: number): number {
        if(this.#isRowFlow) {
            return y * this.#grid.columns + x;
        }

        return x * this.#grid.rows + y;
    }

    to2D(index: number): [number, number] {
        if(this.#isRowFlow) {
            return [
                this.getCrossAxisCoordinate(index),
                this.getFlowAxisCoordinate(index)
            ];
        }

        return [
            this.getFlowAxisCoordinate(index),
            this.getCrossAxisCoordinate(index)
        ];
    }

    getWidgetLength(widget: FlexiWidgetController): number {
        if(this.#isRowFlow) {
            return widget.width;
        }

        return widget.height;
    }

    getFlowAxisCoordinate(position: number): number {
        if(this.#isRowFlow) {
            return Math.floor(position / this.#grid.columns);
        }

        return Math.floor(position / this.#grid.rows);
    }

    getCrossAxisCoordinate(position: number): number {
        if(this.#isRowFlow) {
            return position % this.#grid.columns;
        }

        return position % this.#grid.rows;
    }

    findNearestWidgetFrom2D(x: number, y: number): [number, FlexiWidgetController | null] {
        const position = this.to1D(x, y);

        return this.findNearestWidget(position, 0, this.#widgets.length - 1);
    }

    findNearestWidget(position: number, searchStart: number, searchEnd: number): [number, FlexiWidgetController | null] {
        // Empty
        if(this.#widgets.length === 0) {
            return [0, null];
        }
    
        // Search was exhausted, return the nearest widget.
        if(searchStart === searchEnd) {
            return [searchStart, this.#widgets[searchStart]];
        }
        
        const median = Math.floor((searchStart + searchEnd) / 2);
        const widget = this.#widgets[median];
    
        const widgetValue = this.to1D(widget.x, widget.y);
    
        if(widgetValue === position) {
            // Direct match.
            return [median, widget];
        } else if(widgetValue < position) {
            // Median widget is less than the search value, move search rightwards.
            return this.findNearestWidget(position, median + 1, searchEnd);
        } else {
            // Median widget is greater than the search value, move search leftwards.
            return this.findNearestWidget(position, searchStart, median);
        }
    }

    coordinateFitsWithinCrossAxis(x?: number, y?: number): boolean {
        // If the coordinate for the cross axis is greater than the axis's length, then it can't fit.
        // We don't worry about the width/height, because it'll just wrap to the next row/column.
        if(this.#isRowFlow && x !== undefined && x > this.#columns) {
            return false;
        }

        return !(!this.#isRowFlow && y !== undefined && y > this.#rows);
    }
    
    findPositionToFitWidget(widget: FlexiWidgetController, basePosition: number): number {
        const widgetLength = this.getWidgetLength(widget);
        const crossPosition = this.getCrossAxisCoordinate(basePosition);

        const crossAxisLength = this.getCrossAxisLength();

        if(crossPosition + widgetLength <= crossAxisLength) {
            return basePosition;
        }


        // If it doesn't fit on the current row/column, then move to the next one.
        const flowIndex = this.getFlowAxisCoordinate(basePosition);
        return (flowIndex + 1) * crossAxisLength;
    }

    expandIfNeededToFit(position: number): boolean {
        const length = this.getFlowAxisLength();
        const flowAxisPosition = Math.floor(position / this.getCrossAxisLength());

        // Goes beyond the flow axis' current length, so expand if possible.
        if(flowAxisPosition >= length) {
            return this.setFlowAxisLengthIfPossible(flowAxisPosition + 1);
        }

        return true;
    }

    setFlowAxisLengthIfPossible(length: number): boolean {
        // Oversized
        if(length > this.#grid.maxFlowAxis) {
            return false;
        }

        if(this.#isRowFlow) {
            this.#grid.rows = length;
            return true;
        }

        this.#grid.columns = length;
        return true;
    }

    getFlowAxisLength(): number {
        if(this.#isRowFlow) {
            return this.#grid.rows;
        }

        return this.#grid.columns;
    }

    getCrossAxisLength(): number {
        if(this.#isRowFlow) {
            return this.#grid.columns;
        }

        return this.#grid.rows;
    }
}

type FlexiFlowGridState = {
    rows: number;
    columns: number;
    widgets: FlexiWidgetController[];
}

type FlowGridSnapshot = {
    widgets: WidgetSnapshot[];
    rows: number;
    columns: number;
}