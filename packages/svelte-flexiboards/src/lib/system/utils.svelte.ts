/*
    This MousePosition utility class is inspired by the MousePositionState class from Joy of Code's
    'Creating Reactive Browser APIs In Svelte' video, found at https://youtu.be/BKyENJQ6KdQ.
*/

import type { Position, ProxiedValue } from './types.js';
import type { FlexiGrid } from './grid/base.svelte.js';
import type { FlexiTargetConfiguration } from './target.svelte.js';

export class PointerPositionWatcher {
	#position: Position = $state({
		x: 0,
		y: 0
	});
	#ref: ProxiedValue<HTMLElement | null> = $state() as ProxiedValue<HTMLElement | null>;
	autoScroll: boolean = false;

	constructor(ref: ProxiedValue<HTMLElement | null>) {
		this.#ref = ref;

		const onPointerMove = (event: PointerEvent) => {
			if (!this.ref) {
				return;
			}

			this.updateScroll(event.clientX, event.clientY);

			const rect = this.ref.getBoundingClientRect();

			// this.#position.x = event.clientX - rect.left;
			// this.#position.y = event.clientY - rect.top;
			this.#position.x = event.clientX;
			this.#position.y = event.clientY;

			event.preventDefault();
		};

		$effect(() => {
			window.addEventListener('pointermove', onPointerMove);

			return () => {
				window.removeEventListener('pointermove', onPointerMove);
			};
		});
	}

	updatePosition(clientX: number, clientY: number) {
		if (!this.ref) {
			return;
		}

		this.updateScroll(clientX, clientY);

		const rect = this.ref.getBoundingClientRect();

		// this.#position.x = clientX - rect.left;
		// this.#position.y = clientY - rect.top;
		this.#position.x = clientX;
		this.#position.y = clientY;
	}

	updateScroll(clientX: number, clientY: number) {
		if (!this.autoScroll) {
			return;
		}

		if (!this.ref) {
			return;
		}

		// Very experimental

		const rect = this.ref.getBoundingClientRect();
		const scrollThreshold = 48; // pixels from edge to start scrolling
		const scrollSpeed = 15; // pixels per frame

		// console.log('autoscroll check, ');

		// Check if near bottom edge
		if (clientY > rect.bottom - scrollThreshold) {
			// console.log('scrolling down');
			this.ref.scrollBy(0, scrollSpeed);
		}
		// Check if near top edge
		else if (clientY < rect.top + scrollThreshold) {
			// console.log('scrolling up');
			this.ref.scrollBy(0, -scrollSpeed);
		}

		// Check if near right edge
		if (clientX > rect.right - scrollThreshold) {
			// console.log('scrolling right');
			this.ref.scrollBy(scrollSpeed, 0);
		}
		// Check if near left edge
		else if (clientX < rect.left + scrollThreshold) {
			// console.log('scrolling left');
			this.ref.scrollBy(-scrollSpeed, 0);
		}
	}

	get position() {
		return this.#position;
	}

	get ref() {
		return this.#ref.value;
	}
}

type CellPosition = {
	row: number;
	column: number;
};

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
};

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

	#pointerPosition = $state({
		x: 0,
		y: 0
	});

	#targetConfig: FlexiTargetConfiguration = $state({} as FlexiTargetConfiguration);

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

			this.updateGridDimensions();
		});

		$effect(() => this.setupScrollListener());

		// Whenever the grid is resized, update the sizes.
		$effect(() => {
			const grid = this.#grid!.ref;

			if (!grid) {
				return;
			}

			const observer = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (!entry || !grid) {
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

		if (!gridElement || !window) {
			return;
		}

		const rect = gridElement.getBoundingClientRect();
		const style = window.getComputedStyle(gridElement);

		// Computed style gives us pixel values for each column and row of the grid.
		const templateColumns = style.getPropertyValue('grid-template-columns');
		const templateRows = style.getPropertyValue('grid-template-rows');
		const gapX = style.getPropertyValue('grid-column-gap');
		const gapY = style.getPropertyValue('grid-row-gap');

		// If the dimensions are unchanged, we don't need to update them.
		if (
			templateColumns == this.#dimensions.columnString &&
			templateRows == this.#dimensions.rowString &&
			this.#dimensions.left == rect.left &&
			this.#dimensions.top == rect.top &&
			this.#dimensions.width == rect.width &&
			this.#dimensions.height == rect.height &&
			grid.rows == this.#dimensions.rows.length &&
			grid.columns == this.#dimensions.columns.length
		) {
			return;
		}

		const columns = templateColumns
			.split(' ')
			.map((column) => parseFloat(column.match(/(\d+\.?\d*)px/)?.[1] ?? '0'));
		const rows = templateRows
			.split(' ')
			.map((row) => parseFloat(row.match(/(\d+\.?\d*)px/)?.[1] ?? '0'));

		// Update in-place to avoid replacing the proxy object.
		this.#dimensions.left = rect.left;
		this.#dimensions.width = rect.width;
		this.#dimensions.columns = columns;
		this.#dimensions.top = rect.top;
		this.#dimensions.height = rect.height;
		this.#dimensions.rows = rows;
		this.#dimensions.columnGap = parseFloat(gapX.match(/(\d+\.?\d*)px/)?.[1] ?? '0');
		this.#dimensions.rowGap = parseFloat(gapY.match(/(\d+\.?\d*)px/)?.[1] ?? '0');
		this.#dimensions.columnString = templateColumns;
		this.#dimensions.rowString = templateRows;
	}

	setupScrollListener() {
		const grid = this.#grid;
		const gridElement = grid?.ref;

		if (!gridElement || !window) {
			return;
		}

		const updatePositionOnScroll = () => {
			const rect = gridElement.getBoundingClientRect();
			
			// Update position values that change on scroll
			this.#dimensions.left = rect.left;
			this.#dimensions.top = rect.top;
			this.#dimensions.width = rect.width;
			this.#dimensions.height = rect.height;
		};

		// Set up scroll listener
		window.addEventListener('scroll', updatePositionOnScroll, { passive: true });
		
		// Initial position update
		updatePositionOnScroll();
		
		// Return cleanup function
		return () => {
			window.removeEventListener('scroll', updatePositionOnScroll);
		};
	}

	getCellFromPointerPosition(clientX: number, clientY: number): CellPosition | null {
		if (!this.#grid?.ref) {
			return null;
		}

		this.#pointerPosition.x = clientX;
		this.#pointerPosition.y = clientY;

		let xCell = this.#findCell(
			clientX,
			this.#dimensions.left,
			this.#dimensions.width,
			this.#dimensions.columnGap,
			this.#dimensions.columns
		);
		let yCell = this.#findCell(
			clientY,
			this.#dimensions.top,
			this.#dimensions.height,
			this.#dimensions.rowGap,
			this.#dimensions.rows
		);

		return {
			row: yCell,
			column: xCell
		};
	}

	#findCell(
		pointerLocation: number,
		start: number,
		size: number,
		gap: number,
		axisCoordinates: number[]
	) {
		// If outside the axis, then return the ends.
		if (pointerLocation < start) {
			return 0;
		}
		if (pointerLocation >= start + size) {
			return axisCoordinates.length;
		}

		let subtotal = start - gap / 2;
		for (let i = 0; i < axisCoordinates.length; i++) {
			const base = subtotal;
			subtotal += axisCoordinates[i] + gap;

			const proportionAlong = (pointerLocation - base) / (subtotal - base);
			if (pointerLocation < subtotal) {
				return i + proportionAlong;
			}
		}
		return axisCoordinates.length;
	}
}
