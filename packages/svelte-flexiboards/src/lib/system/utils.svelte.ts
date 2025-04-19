/*
    This MousePosition utility class is inspired by the MousePositionState class from Joy of Code's
    'Creating Reactive Browser APIs In Svelte' video, found at https://youtu.be/BKyENJQ6KdQ.
*/

import type { Position, ProxiedValue } from './types.js';
import type { FlexiGrid } from './grid/base.svelte.js';
import type { FlexiTargetConfiguration } from './target.svelte.js';
import type { FlexiWidgetController, FlexiWidgetTriggerConfiguration } from './widget.svelte.js';

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

		const rect = this.ref.getBoundingClientRect();

		// NEXT: Provide a configuration option for the scroll threshold and speed.
		// Not done in v0.2 as it's likely this system is going to be rewritten in v0.3.
		const scrollThreshold = 48;
		const scrollSpeed = 10;

		// Scroll vertically if near top or bottom edges.
		if (clientY > rect.bottom - scrollThreshold) {
			this.ref.scrollBy(0, scrollSpeed);
		} else if (clientY < rect.top + scrollThreshold) {
			this.ref.scrollBy(0, -scrollSpeed);
		}

		// Scroll horizontally if near left or right edges.
		if (clientX > rect.right - scrollThreshold) {
			this.ref.scrollBy(scrollSpeed, 0);
		} else if (clientX < rect.left + scrollThreshold) {
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

			// Update in-place for reactivity.
			this.#dimensions.left = rect.left;
			this.#dimensions.top = rect.top;
			this.#dimensions.width = rect.width;
			this.#dimensions.height = rect.height;
		};

		// Set up scroll listener, and initially update
		window.addEventListener('scroll', updatePositionOnScroll, { passive: true });
		updatePositionOnScroll();

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

interface PointerDownTriggerCondition {
	type: 'immediate';
}

interface PointerLongPressTriggerCondition {
	type: 'longPress';
	duration: number;
}

export const immediateTriggerConfig = (): PointerDownTriggerCondition => ({ type: 'immediate' });
export const longPressTriggerConfig = (duration?: number): PointerLongPressTriggerCondition => ({
	type: 'longPress',
	duration: duration ?? 300
});

export type PointerTriggerCondition =
	| PointerDownTriggerCondition
	| PointerLongPressTriggerCondition;

/**
 * Watches pointer events on a widget, issuing a grab event to the widget if the event satisfies the configured behaviour.
 * (e.g. long press for touch)
 */
export class WidgetPointerEventWatcher {
	#widget: FlexiWidgetController = $state() as FlexiWidgetController;
	#type: 'grab' | 'resize' = $state('grab');

	#triggerConfig: FlexiWidgetTriggerConfiguration = $derived(
		this.#type == 'resize' ? this.#widget.resizeTrigger : this.#widget.grabTrigger
	);

	constructor(widget: FlexiWidgetController, type: 'grab' | 'resize') {
		this.#widget = widget;
		this.#type = type;
	}

	onstartpointerdown(event: PointerEvent) {
		const pointerType = event.pointerType;

		const triggerForType = this.#triggerConfig[pointerType] ?? this.#triggerConfig.default;

		event.preventDefault();

		if (triggerForType.type == 'longPress') {
			return this.#handleLongPress(event, triggerForType);
		}
		return this.#triggerWidgetEvent(event);
	}

	#eventTimeout: ReturnType<typeof setTimeout> | null = null;

	#handleLongPress(event: PointerEvent, trigger: PointerLongPressTriggerCondition) {
		if (this.#eventTimeout) {
			clearTimeout(this.#eventTimeout);
		}

		const startX = event.clientX;
		const startY = event.clientY;
		const pointerId = event.pointerId;

		const moveThreshold = 16; // 16px movement threshold
		let isPointerDown = true;
		let currentX = startX;
		let currentY = startY;

		// Track if pointer is still down and its position
		const pointerUpHandler = (e: PointerEvent) => {
			if (e.pointerId === pointerId) {
				isPointerDown = false;
				document.removeEventListener('pointerup', pointerUpHandler);
				document.removeEventListener('pointercancel', pointerUpHandler);
				document.removeEventListener('pointermove', pointerMoveHandler);
			}
		};

		// Track pointer movement
		const pointerMoveHandler = (e: PointerEvent) => {
			if (e.pointerId === pointerId) {
				e.preventDefault();
				currentX = e.clientX;
				currentY = e.clientY;
			}
		};

		document.addEventListener('pointerup', pointerUpHandler);
		document.addEventListener('pointercancel', pointerUpHandler);
		document.addEventListener('pointermove', pointerMoveHandler);

		this.#eventTimeout = setTimeout(() => {
			// Only trigger if pointer is still down and hasn't moved too much
			if (isPointerDown) {
				const distance = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

				if (distance <= moveThreshold) {
					this.#triggerWidgetEvent(event);
				}
			}

			document.removeEventListener('pointerup', pointerUpHandler);
			document.removeEventListener('pointercancel', pointerUpHandler);
			document.removeEventListener('pointermove', pointerMoveHandler);
		}, trigger.duration);
	}

	#triggerWidgetEvent(event: PointerEvent) {
		if (this.#type == 'resize') {
			this.#widget.onresize(event);
			return;
		}
		this.#widget.ongrab(event);
	}
}
