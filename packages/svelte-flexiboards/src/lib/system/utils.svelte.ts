
/*
    This MousePosition utility class is inspired by the MousePositionState class from Joy of Code's
    'Creating Reactive Browser APIs In Svelte' video, found at https://youtu.be/BKyENJQ6KdQ.
*/

import { getContext, setContext } from "svelte";
import type { Position } from "./types.js";
import type { FlexiWidget } from "./widget.svelte.js";
import type { FlexiGrid } from "./grid.svelte.js";
import type { FlexiTargetConfiguration, TargetSizing } from "./target.svelte.js";

export class PointerPositionWatcher {
    #position: Position = $state({
        x: 0,
        y: 0
    });
    #ref: { ref: HTMLElement | null } = $state({
        ref: null
    });

    constructor(ref: { ref: HTMLElement | null }) {
        this.#ref = ref;

        const onPointerMove = (event: PointerEvent) => {    
            if(!this.#ref.ref) {
                return;
            }

            const rect = this.#ref.ref.getBoundingClientRect();

            this.#position.x = event.clientX - rect.left;
            this.#position.y = event.clientY - rect.top;

            event.preventDefault();
        };

        $effect(() => {
            window.addEventListener('pointermove', onPointerMove);

            return () => {
                window.removeEventListener('pointermove', onPointerMove);
            };
        });
    }

    get position() {
        return this.#position;
    }
}

// TODO: we should separate widget entirely into a placeholder / actual system which would make this wrapper system obsolete
const contextKey = Symbol('flexiwidgetwrapper');

export function flexiwidgetwrapper(widget: FlexiWidget) {
    setContext(contextKey, widget);
}

export function getFlexiwidgetwrapperCtx() {
    return getContext<FlexiWidget | undefined>(contextKey);
}

type GridCurrentCell = {
    row: number;
    column: number;
    startX: number;
    startY: number;
    sizeX: number;
    sizeY: number;
}

type GridDimensions = {
    left: number;
    width: number;
    columns: number[];
    columnString: string;
    columnGap: number;

    top: number;
    height: number;
    rows: number[];
    rowString: string;
    rowGap: number;
}

export class GridDimensionTracker {
    #dimensions: GridDimensions = $state({
        left: 0,
        width: 0,
        columns: [],
        columnString: '',
        columnGap: 0,

        top: 0,
        height: 0,
        rows: [],
        rowString: '',
        rowGap: 0
    });

    #grid: FlexiGrid | null = $state(null);
    #rows: number = $derived(this.#grid?.rows ?? 0);
    #columns: number = $derived(this.#grid?.columns ?? 0);

    #targetConfig: FlexiTargetConfiguration = $state({} as FlexiTargetConfiguration);

    #currentCell: GridCurrentCell | null = null;

    constructor(grid: FlexiGrid, targetConfig: FlexiTargetConfiguration) {
        this.#grid = grid;
        this.#targetConfig = targetConfig;
    }

    watchGrid() {
        // Whenever a change occurs to the grid's dimensions or the underlying widgets, update the sizes.
        $effect(() => {
            const grid = this.#grid!;

            const columns = grid.columns ?? 0;
            const rows = grid.rows ?? 0;
            const widgets = grid.widgets;

            this.updateGridDimensions();
        });

        // Whenever the grid is resized, update the sizes.
        $effect(() => {
            const grid = this.#grid!.ref;

            if(!grid) {
                return;
            }

            const observer = new ResizeObserver((entries) => {
                const entry = entries[0];
                if(!entry || !grid) {
                    return;
                }

                this.updateGridDimensions();
            });

            observer.observe(grid);

            return () => {
                observer.disconnect();
            };
        });
    }

    updateGridDimensions() {
        const grid = this.#grid;
        const gridElement = grid?.ref;

        if(!gridElement || !window) {
            return;
        }

        const rect = gridElement.getBoundingClientRect();
        const style = window.getComputedStyle(gridElement);

        // Computed style gives us pixel values for each column and row of the grid.
        const templateColumns = style.getPropertyValue('grid-template-columns');
        const templateRows = style.getPropertyValue('grid-template-rows');
        const gapX = style.getPropertyValue('grid-column-gap');
        const gapY = style.getPropertyValue('grid-row-gap');

        console.log("Template columns: ", templateColumns);
        console.log("Template rows: ", templateRows);
        console.log("Gap X: ", gapX);
        console.log("Gap Y: ", gapY);

        // If the dimensions are unchanged, we don't need to update them.
        if(templateColumns == this.#dimensions.columnString 
            && templateRows == this.#dimensions.rowString 
            && this.#dimensions.left == rect.left 
            && this.#dimensions.top == rect.top 
            && this.#dimensions.width == rect.width 
            && this.#dimensions.height == rect.height
            && grid.rows == this.#dimensions.rows.length
            && grid.columns == this.#dimensions.columns.length) {
            return;
        }

        // Reset the current cell because it relies on stale information.
        this.#currentCell = null;

        const columns = templateColumns.split(' ').map(column => parseFloat(column.match(/(\d+\.?\d*)px/)?.[1] ?? '0'));
        const rows = templateRows.split(' ').map(row => parseFloat(row.match(/(\d+\.?\d*)px/)?.[1] ?? '0'));

        // Update in-place to avoid replacing the proxy object.
        this.#dimensions.left = rect.left;
        this.#dimensions.width = rect.width;
        this.#dimensions.columns = columns;
        this.#dimensions.top = rect.top;
        this.#dimensions.height = rect.height;
        this.#dimensions.rows = rows;
        this.#dimensions.columnGap = parseFloat(gapX.match(/(\d+\.?\d*)px/)?.[1] ?? '0');
        this.#dimensions.rowGap = parseFloat(gapY.match(/(\d+\.?\d*)px/)?.[1] ?? '0');

        console.log("Dimensions: ", this.#dimensions);
    }

    getCellFromPointerPosition(clientX: number, clientY: number) {
        // TODO: Either try reinstate this or delete it
        // If the current cell still matches the pointer position, return it without having to search for it again
        // if(this.#currentCell && this.#isInsideCell(clientX, this.#currentCell.startX, this.#currentCell.sizeX) && this.#isInsideCell(clientY, this.#currentCell.startY, this.#currentCell.sizeY)) {
        //     return this.#currentCell;
        // }
        // this.#currentCell = null;


        if(!this.#grid?.ref) {
            return null;
        }

        const rect = this.#grid.ref.getBoundingClientRect();

        let xCell = this.#findCell(clientX, this.#dimensions.left, this.#dimensions.width, this.#dimensions.columnGap, this.#dimensions.columns);
        let yCell = this.#findCell(clientY, this.#dimensions.top, this.#dimensions.height, this.#dimensions.rowGap, this.#dimensions.rows);

        return {
            row: yCell,
            column: xCell
        };
    }

    #findCell(pointerLocation: number, start: number, size: number, gap: number, axisCoordinates: number[]) {
        // TODO: there might be ways to optimise this.
        // If outside the axis, then return the ends.
        if(pointerLocation < start) {
            return 0;
        }
        if(pointerLocation >= start + size) {
            return axisCoordinates.length;
        }

        let subtotal = start;
        for(let i = 0; i < axisCoordinates.length; i++) {
            subtotal += axisCoordinates[i] + gap;
            if(pointerLocation < subtotal) {
                return i;
            }
        }
        return axisCoordinates.length;
    }

    #isInsideCell(pointerLocation: number, start: number, size: number) {
        return pointerLocation >= start && pointerLocation < start + size;
    }
}