import { setContext, untrack } from 'svelte';
import { getContext } from 'svelte';
import { getPointerService, GridDimensionTracker, PointerService } from '../shared/utils.svelte.js';
import type { InternalFlexiTargetController } from '../target/controller.svelte.js';
import type { FlexiTargetConfiguration, TargetSizing } from '../target/types.js';
import type { FlexiWidgetController } from '../widget/index.js';
import { getInternalFlexitargetCtx } from '../target/index.js';
import type { InternalFlexiWidgetController } from '../widget/controller.svelte.js';
import { FlexiEventBus, getFlexiEventBus } from '../shared/event-bus.js';

export type MoveOperation = {
	widget: InternalFlexiWidgetController;
	newX: number;
	newY: number;
	oldX: number;
	oldY: number;
};

export type WidgetSnapshot = {
	widget: InternalFlexiWidgetController;
	x: number;
	y: number;
	width: number;
	height: number;
};

export abstract class FlexiGrid {
	abstract tryPlaceWidget(
		widget: FlexiWidgetController,
		cellX?: number,
		cellY?: number,
		width?: number,
		height?: number,
		isGrabbedWidget?: boolean
	): boolean;
	abstract removeWidget(widget: FlexiWidgetController): boolean;
	abstract takeSnapshot(): unknown;
	abstract restoreFromSnapshot(snapshot: unknown): void;
	abstract mapRawCellToFinalCell(x: number, y: number): [number, number];

	/**
	 * Apply any post-completion operations like row/column collapsing.
	 */
	applyPostCompletionOperations(): void {}

	_target: InternalFlexiTargetController;
	_targetConfig: FlexiTargetConfiguration;

	mouseCellPosition: { x: number; y: number } = $state({
		x: 0,
		y: 0
	});

	#ref: { ref: HTMLElement | null } = $state({ ref: null });
	#pointerService: PointerService = getPointerService();
	#eventBus: FlexiEventBus = getFlexiEventBus();

	#unsubscribers: (() => void)[] = [];

	_dimensionTracker: GridDimensionTracker;

	constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
		this._target = target;
		this._targetConfig = targetConfig;

		this._dimensionTracker = new GridDimensionTracker(this, targetConfig);

		this.#unsubscribers.push(
			this.#eventBus.subscribe('pointer:moved', (event) => {
				this.#updatePointerPosition(event.x, event.y);
			})
		);
	}

	style: string = $derived.by(() => {
		return `display: grid; grid-template-columns: ${this.#getSizing(this.columns, this._targetConfig.columnSizing)}; grid-template-rows: ${this.#getSizing(this.rows, this._targetConfig.rowSizing)};`;
	});

	#getSizing(axisCount: number, sizing: TargetSizing) {
		if (typeof sizing === 'string') {
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
		if (rawCell) {
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
			cellY: this.mouseCellPosition.y,
			rawCellX: rawCell?.column ?? 0,
			rawCellY: rawCell?.row ?? 0
		});
	}

	watchGridElementDimensions() {
		if (!this.ref) {
			return;
		}

		this._dimensionTracker.watchGrid();
	}

	/**
	 * Clears the grid layout.
	 */
	abstract clear(): void;

	forceUpdatePointerPosition(clientX: number, clientY: number) {
		// TODO: just a test, don't think this does anything.
		untrack(() => {
			this.#updatePointerPosition(clientX, clientY);
		});
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

const contextKey = Symbol('flexigrid');

export function flexigrid() {
	const target = getInternalFlexitargetCtx();

	if (!target) {
		throw new Error(
			'A FlexiGrid was instantiated outside of a FlexiTarget context. Ensure that flexigrid() is called within a FlexiTarget component.'
		);
	}

	const grid = target.createGrid();
	setContext(contextKey, grid);

	// Tell the grid's dimension tracker to watch the grid element.
	$effect(() => {
		grid.watchGridElementDimensions();
	});

	return {
		grid
	};
}

export function getFlexigridCtx() {
	return getContext<FlexiGrid | undefined>(contextKey);
}
