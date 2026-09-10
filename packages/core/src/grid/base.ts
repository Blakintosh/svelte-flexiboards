import type { Position } from '../types.js';
import { getPointerService, GridDimensionTracker, PointerService } from '../shared/utils.js';
import type { InternalFlexiTargetController } from '../target/controller.js';
import type { FlexiTargetConfiguration, TargetSizing } from '../target/types.js';
import type { FlexiWidgetController } from '../widget/base.js';
import type { InternalFlexiWidgetController } from '../widget/controller.js';
import { FlexiEventBus, getFlexiEventBus } from '../shared/event-bus.js';
import {
	computed,
	signal,
	trigger,
	untracked,
	type ReadonlySignal,
	type Signal
} from '../reactivity.js';

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

	/**
	 * Stores a drag snapshot so that mapRawCellToFinalCell can map cursor positions
	 * through the snapshot's widget positions instead of the live (displaced) grid.
	 */
	/**
	 * @param origin The cell the dragged widget occupied in this grid before being grabbed, if it
	 * originated here. Lets layouts resolve drops by direction of travel.
	 */
	setDragSnapshot(snapshot: unknown, origin?: Position | null): void {}

	/**
	 * Clears the stored drag snapshot.
	 */
	clearDragSnapshot(): void {}

	_target: InternalFlexiTargetController;
	/**
	 * The target's live configuration: sizing changes pushed through the
	 * adapter's prop seam show up in the grid's style. (The layout itself is
	 * fixed for the grid's lifetime — each grid class snapshots it at
	 * construction.)
	 */
	get _targetConfig(): FlexiTargetConfiguration {
		return this._target.config;
	}

	#mouseCellPosition$: Signal<{ x: number; y: number }> = signal({
		x: 0,
		y: 0
	});

	#ref$: Signal<HTMLElement | undefined> = signal(undefined);
	#pointerService: PointerService = getPointerService();
	#eventBus: FlexiEventBus = getFlexiEventBus();

	#unsubscribers: (() => void)[] = [];

	_dimensionTracker: GridDimensionTracker;

	constructor(target: InternalFlexiTargetController, targetConfig: FlexiTargetConfiguration) {
		this._target = target;

		this._dimensionTracker = new GridDimensionTracker(this, targetConfig);

		this.#unsubscribers.push(
			this.#eventBus.subscribe('pointer:moved', (event) => {
				this.#updatePointerPosition(event.x, event.y);
			})
		);
	}

	style$: ReadonlySignal<string> = computed(() => {
		return `display: grid; grid-template-columns: ${this.#getSizing(this.columns, this._targetConfig.columnSizing)}; grid-template-rows: ${this.#getSizing(this.rows, this._targetConfig.rowSizing)};`;
	});

	get style(): string {
		return this.style$();
	}

	#getSizing(axisCount: number, sizing: TargetSizing) {
		if (typeof sizing === 'string') {
			return `repeat(${axisCount}, ${sizing})`;
		}
		return sizing({ target: this._target, grid: this });
	}

	/** Pointer movement (px) since the previous pointer update; layouts may use it for hysteresis. */
	protected _pointerDelta: Position = { x: 0, y: 0 };
	#lastClientPosition: Position | null = null;

	#updatePointerPosition(clientX: number, clientY: number) {
		if (!this.ref) {
			return;
		}

		const last = this.#lastClientPosition;
		this._pointerDelta = last ? { x: clientX - last.x, y: clientY - last.y } : { x: 0, y: 0 };
		this.#lastClientPosition = { x: clientX, y: clientY };

		const rawCell = this._dimensionTracker.getCellFromPointerPosition(clientX, clientY);

		let cell = rawCell;
		if (rawCell) {
			const [x, y] = this.mapRawCellToFinalCell(rawCell.column, rawCell.row);
			cell = {
				row: y,
				column: x
			};
		}

		const mouseCellPosition = this.#mouseCellPosition$();
		mouseCellPosition.x = cell?.column ?? 0;
		mouseCellPosition.y = cell?.row ?? 0;
		trigger(() => this.#mouseCellPosition$());

		this._target.onmousegridcellmove({
			cellX: mouseCellPosition.x,
			cellY: mouseCellPosition.y,
			rawCellX: rawCell?.column ?? 0,
			rawCellY: rawCell?.row ?? 0
		});
	}

	/**
	 * Tells the grid's dimension tracker to watch the grid element.
	 * Call at mount time (the adapter's responsibility) and invoke the
	 * returned cleanup at unmount.
	 */
	watchGridElementDimensions(): (() => void) | undefined {
		if (!this.ref) {
			return;
		}

		return this._dimensionTracker.watchGrid();
	}

	/**
	 * Clears the grid layout.
	 */
	abstract clear(): void;

	forceUpdatePointerPosition(clientX: number, clientY: number) {
		// TODO: just a test, don't think this does anything.
		untracked(() => {
			this.#updatePointerPosition(clientX, clientY);
		});
	}

	// Getters
	abstract get rows(): number;
	abstract get columns(): number;

	get mouseCellPosition() {
		return this.#mouseCellPosition$();
	}

	get ref() {
		return this.#ref$();
	}
	set ref(ref: HTMLElement | undefined) {
		this.#ref$(ref);
	}

	/**
	 * Cleanup method, called by the owning target controller's destroy().
	 */
	destroy() {
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}
}

// TODO(adapter): removed flexigrid — created the grid via the FlexiTarget context, registered it
// in a new flexigrid context, and $effect-ed grid.watchGridElementDimensions() at mount time.
// TODO(adapter): removed getFlexigridCtx — retrieved the FlexiGrid instance from the flexigrid context.
