import { untrack } from 'svelte';
import { FlexiGrid, FlowFlexiGrid } from '../grid/index.js';
import type {
	InternalTargetEvent,
	InternalWidgetDroppedEvent,
	InternalWidgetEvent,
	InternalWidgetGrabbedEvent,
	InternalWidgetResizingEvent
} from '../internal-types.js';
import {
	untracked,
	type MouseGridCellMoveEvent,
	type Position,
	type ReadonlySignal,
	type Signal
} from '../types.js';
import { FlexiWidgetController } from '../widget/base.js';
import { InternalFlexiWidgetController } from '../widget/controller.js';
import type { FlexiWidgetConfiguration, FlexiWidgetDefaults } from '../widget/types.js';
import type { InternalFlexiBoardController } from '../board/controller.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import type { FlexiTargetController } from './base.js';
import type {
	FlexiTargetActionWidget,
	FlexiTargetConfiguration,
	FlexiTargetDefaults,
	FlexiTargetPartialConfiguration,
	FlexiTargetState
} from './types.js';
import { getPointerService } from '../shared/utils.js';
import type { FlexiRegistryEntry, FlexiWidgetLayoutEntry } from '../board/types.js';
import { FreeFormFlexiGrid } from '../grid/free-grid.js';
import { computed, effect, signal, trigger } from 'alien-signals';

export class InternalFlexiTargetController implements FlexiTargetController {
	#widgets$: Signal<Set<InternalFlexiWidgetController>> = signal(new Set());
	#orderedWidgets$: Signal<InternalFlexiWidgetController[]> = signal([]);

	provider$: Signal<InternalFlexiBoardController> = signal({} as InternalFlexiBoardController);

	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];

	#providerTargetDefaults$: ReadonlySignal<FlexiTargetDefaults | undefined> = computed(() => this.provider$()?.config$()?.targetDefaults);
	providerWidgetDefaults$: ReadonlySignal<FlexiWidgetDefaults | undefined> = computed(() => this.provider$()?.config$()?.widgetDefaults);

	#initialWidgetRegistrations: Array<{
		config: FlexiWidgetConfiguration;
		onCreated?: (widget: FlexiWidgetController) => void;
	}> = [];

	/**
	 * Stores the underlying state of the target.
	 */
	#state$: Signal<FlexiTargetState> = signal({
		hovered: false,
		actionWidget: null,
		prepared: false
	});

	#dropzoneWidget$: Signal<InternalFlexiWidgetController | null> = signal(null);
	#dropzoneWidgetDestroy: (() => void) | null = null;
	#isDropzoneWidgetAdded$: Signal<boolean> = signal(false);

	#mouseCellPosition: Position = $state({
		x: 0,
		y: 0
	});

	// Raw (fractional) cell position - used for resize snapping (rounds instead of floors)
	#rawMouseCellPosition$: Signal<Position> = signal({
		x: 0,
		y: 0
	});

	key: string;

	#grid: FlexiGrid | null = null;

	#preGrabSnapshot: unknown | null = null;
	#gridSnapshot: unknown | null = null;

	registry?: Record<string, FlexiRegistryEntry> = $derived(this.provider$()?.registry$());

	#targetConfig?: FlexiTargetPartialConfiguration = $state(undefined);

	#pointerService = getPointerService();

	config: FlexiTargetConfiguration = $derived({
		layout: this.#targetConfig?.layout ??
			this.#providerTargetDefaults$()?.layout ?? {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append'
			},
		rowSizing:
			this.#targetConfig?.rowSizing ??
			this.#providerTargetDefaults$()?.rowSizing ??
			'minmax(1rem, auto)',
		columnSizing:
			this.#targetConfig?.columnSizing ??
			this.#providerTargetDefaults$()?.columnSizing ??
			'minmax(0, 1fr)',
		widgetDefaults: this.#targetConfig?.widgetDefaults
	});

	constructor(
		provider: InternalFlexiBoardController,
		key: string,
		config?: FlexiTargetPartialConfiguration
	) {
		this.provider$(provider);
		this.#targetConfig = config;
		this.key = key;
		this.#eventBus = getFlexiEventBus();

		this.#trackPointerHover();

		this.#unsubscribers.push(
			this.#eventBus.subscribe('widget:grabbed', this.onWidgetGrabbed.bind(this)),
			this.#eventBus.subscribe('widget:resizing', this.onWidgetResizing.bind(this)),
			this.#eventBus.subscribe('widget:cancel', this.onWidgetCancel.bind(this)),
			this.#eventBus.subscribe('widget:release', this.onWidgetRelease.bind(this)),
			this.#eventBus.subscribe('widget:dropped', this.onWidgetDropped.bind(this)),
			this.#eventBus.subscribe('target:pointerenter', this.onPointerEnterTarget.bind(this)),
			this.#eventBus.subscribe('target:pointerleave', this.onPointerLeaveTarget.bind(this)),
			this.#eventBus.subscribe('widget:entertarget', this.onWidgetEnterTarget.bind(this)),
			this.#eventBus.subscribe('widget:leavetarget', this.onWidgetLeaveTarget.bind(this)),
			this.#eventBus.subscribe('widget:delete', this.onWidgetDelete.bind(this))
		);
	}

	#trackPointerHover() {
		// Emulate pointer enter/leave events instead of relying on browser ones, so that we can
		// make it universal with our keyboard pointer.
		effect(() => {
			if (!this.#grid?.ref) {
				return;
			}

			const isPointerInside = this.#pointerService.isPointerInside(this.#grid.ref);

			// Only check when keyboard controls are active
			untrack(() => {
				this.#updatePointerOverState(isPointerInside);
			});
		});
	}

	/**
	 * Dispatches the appropriate enter/leave events based on the pointer's current state.
	 */
	#updatePointerOverState(inside: boolean) {
		const wasHovered = this.hovered;

		if (inside && !wasHovered) {
			// Just entered
			this.#eventBus.dispatch('target:pointerenter', {
				board: this.provider$(),
				target: this
			});
		} else if (!inside && wasHovered) {
			// Just left
			this.#eventBus.dispatch('target:pointerleave', {
				board: this.provider$(),
				target: this
			});
		}
	}

	#tryAddWidget(
		widget: InternalFlexiWidgetController,
		x?: number,
		y?: number,
		width?: number,
		height?: number
	): boolean {
		const added = this.grid.tryPlaceWidget(widget, x, y, width, height);

		if (added) {
			// Mutate and trigger reactivity manually
			this.#widgets$().add(widget);
			trigger(() => this.#widgets$());

			this.#updateOrderedWidgets();
			widget.target = this;
			widget.internalTarget = this;
		}
		return added;
	}

	createGrid() {
		if (this.#grid) {
			console.warn(
				'A grid already exists but is being replaced. If this is due to a hot reload, this is no cause for alarm.'
			);
		}

		const layout = this.config.layout;
		switch (layout.type) {
			case 'free':
				this.#grid = new FreeFormFlexiGrid(this, this.config);
				break;
			case 'flow':
				this.#grid = new FlowFlexiGrid(this, this.config);
				break;
		}
		return this.#grid;
	}

	createWidget(config: FlexiWidgetConfiguration) {
		const [x, y, width, height] = [config.x, config.y, config.width, config.height];

		let widgetConfig = {};

		if(config.type) {
			if(!this.registry?.[config.type]) {
				console.warn('createWidget(): widget with type ', config.type, ' not found in registry, it will be missing settings.');
			} else {
				widgetConfig = {...this.registry[config.type]};
			}
		}

		const widget = new InternalFlexiWidgetController({
			config: {...widgetConfig, ...config},
			provider: this.provider$(),
			target: this,
			type: config.type
		});

		// If the widget can't be added, it's probably a collision.
		if (!this.#tryAddWidget(widget, x, y, width, height)) {
			console.warn(
				"Failed to add widget to target. Check that the widget's x and y coordinates do not lead to an unresolvable collision."
			);
			return undefined;
		}

		return widget;
	}

	registerWidget(config: FlexiWidgetConfiguration, onCreated?: (widget: FlexiWidgetController) => void) {
		this.#initialWidgetRegistrations.push({ config, onCreated });
	}

	onWidgetDelete(event: InternalWidgetEvent) {
		if (event.target != this) {
			return;
		}

		this.deleteWidget(event.widget);
	}

	/**
	 * Deletes the given widget from this target, if it exists.
	 * @returns Whether the widget was deleted.
	 */
	deleteWidget(widget: FlexiWidgetController): boolean {
		const deleted = this.#widgets$().delete(widget);
		this.grid.removeWidget(widget);

		// Update the ordered widgets list to reflect the deletion
		if (deleted) {
			trigger(() => this.#widgets$());
			this.#updateOrderedWidgets();
		}

		// TODO: this might not be the best way to handle this. Check whether deleteWidget
		// is still needed.
		// Clean up the widget when it's removed from the target
		if (deleted && 'destroy' in widget) {
			(widget as InternalFlexiWidgetController).destroy();
		}

		// Clear the pre-grab snapshot only if the deleted widget is the one being grabbed/resized
		// (prevents the board's safety net from restoring a widget that was intentionally removed)
		// Note: We don't clear if a different widget is deleted during a grab operation
		if (this.actionWidget?.widget === widget) {
			this.forgetPreGrabSnapshot();
		}

		// Apply any deferred operations like row collapsing now that the operation is complete
		this.applyGridPostCompletionOperations();

		return deleted;
	}

	/**
	 * Imports a layout of widgets into this target, replacing any existing widgets.
	 * Widgets with types not found in the registry will be skipped with a warning.
	 * @param layout The layout to import.
	 */
	importLayout(layout: FlexiWidgetLayoutEntry[]) {
		if (!this.registry) {
			console.warn('importLayout(): no registry provided, cannot import layout. Provide a registry to the FlexiBoard component.');
			return;
		}

		this.#widgets$().clear();
		this.grid.clear();

		for (const entry of layout) {
			if (!entry.type) {
				console.warn('importLayout(): skipping widget entry with no type:', entry);
				continue;
			}

			if (!this.registry[entry.type]) {
				console.warn(`importLayout(): widget type "${entry.type}" not found in registry, skipping widget.`);
				continue;
			}

			this.createWidget({
				id: entry.id,
				type: entry.type,
				x: entry.x,
				y: entry.y,
				width: entry.width,
				height: entry.height,
				metadata: entry.metadata
			});
		}

		// Re-trigger widget reactivity.
		trigger(() => this.#widgets$());
	}

	/**
	 * Exports the current layout of widgets from this target.
	 * @returns The layout of widgets.
	 */
	exportLayout(): FlexiWidgetLayoutEntry[] {
		// Prevent reactive subscriptions onto exportLayout directly - they should use onLayoutChange.
		return untracked(() => {
			const result: FlexiWidgetLayoutEntry[] = [];

			// Likely much more information than needed, but we've got it.
			for (const widget of this.internalWidgets) {
				if (!widget.type) {
					console.warn('exportLayout(): widget has no type, it will be skipped.');
					continue;
				}

				const entry: FlexiWidgetLayoutEntry = {
					type: widget.type,
					width: widget.width,
					height: widget.height,
					x: widget.x,
					y: widget.y,
					metadata: widget.metadata
				};

				// Only include id if user provided one
				if (widget.userProvidedId) {
					entry.id = widget.userProvidedId;
				}

				result.push(entry);
			}

			return result;
		});
	}

	#createShadow(of: FlexiWidgetController, action: FlexiTargetActionWidget['action']) {
		const shadow = new InternalFlexiWidgetController({
			config: {
				width: of.width,
				height: of.height,
				component: of.component,
				draggable: of.draggable,
				draggability: of.draggability,
				resizability: of.resizability,
				snippet: of.snippet,
				className: of.className,
				componentProps: of.componentProps,
				metadata: of.metadata
			},
			provider: this.provider$(),
			target: this,
			isShadow: true
		});
		shadow.interpolationAnimationHint = action === 'resize' ? 'resize' : 'move';

		return shadow;
	}

	// Events
	onPointerEnterTarget(event: InternalTargetEvent) {
		if (event.target != this) {
			return;
		}

		this.#setHovered(true);
	}

	onPointerLeaveTarget(event: InternalTargetEvent) {
		if (event.target != this) {
			return;
		}

		this.#setHovered(false);
	}

	restorePreGrabSnapshot() {
		if (!this.#preGrabSnapshot) {
			return;
		}

		this.grid.restoreFromSnapshot(this.#preGrabSnapshot!);
		this.forgetPreGrabSnapshot();
	}

	forgetPreGrabSnapshot() {
		this.#preGrabSnapshot = null;
	}

	hasPreGrabSnapshot(): boolean {
		return this.#preGrabSnapshot !== null;
	}

	applyGridPostCompletionOperations(): void {
		this.grid.applyPostCompletionOperations();
	}

	cancelDrop() {
		this.#setActionWidget(null);
		this.#removeDropzoneWidget();
	}

	tryDropWidget(widget: InternalFlexiWidgetController): boolean {
		const actionWidget = this.actionWidget;
		if (!actionWidget) {
			return false;
		}

		let [x, y, width, height] = this.#getDropzoneLocation(actionWidget);

		this.#setActionWidget(null);
		this.#removeDropzoneWidget();

		widget.isBeingDropped = true;

		// Try to formally place the widget in the grid, which will also serve as a final check that
		// the drop is possible.
		const result = this.#tryAddWidget(widget, x, y, width, height);
		if (!result) {
			widget.isBeingDropped = false;
		}

		// Apply any deferred operations like row collapsing now that the operation is complete
		if (result) {
			this.applyGridPostCompletionOperations();
			// Clear any pre-grab snapshot for same-target moves
			this.forgetPreGrabSnapshot();
		}

		return result;
	}

	onmousegridcellmove(event: MouseGridCellMoveEvent) {
		this.#updateMouseCellPosition(event.cellX, event.cellY);
		const rawMouseCellPosition = this.#rawMouseCellPosition$();
		rawMouseCellPosition.x = event.rawCellX;
		rawMouseCellPosition.y = event.rawCellY;
		trigger(() => this.#rawMouseCellPosition$());
		this.#updateDropzoneWidget();
	}

	onWidgetGrabbed(event: InternalWidgetGrabbedEvent) {
		// Nothing to do if it's not under this target.
		if (event.target != this) {
			return;
		}

		this.#setActionWidget({
			action: 'grab',
			widget: event.widget
		});

		// Take a snapshot of the grid before the widget is removed, so if the widget is not successfully placed
		// we can restore the grid to its original state.
		this.#preGrabSnapshot = this.grid.takeSnapshot();

		// Remove the widget from the grid as it's now in a floating state.
		this.grid.removeWidget(event.widget);
		this.grid.forceUpdatePointerPosition(event.clientX, event.clientY);

		this.#createDropzoneWidget();
	}

	onWidgetResizing(event: InternalWidgetResizingEvent) {
		if (event.target != this) {
			return;
		}

		this.#setActionWidget({
			action: 'resize',
			widget: event.widget
		});

		// Take a snapshot of the grid before the widget is removed, so if the widget is not successfully placed
		// we can restore the grid to its original state.
		this.#preGrabSnapshot = this.grid.takeSnapshot();

		// Remove the widget from the grid as it's now in a floating state.
		this.grid.removeWidget(event.widget);
		this.grid.forceUpdatePointerPosition(event.clientX, event.clientY);

		this.#createDropzoneWidget();
	}

	onWidgetCancel(event: InternalWidgetEvent) {
		if (event.target != this) {
			return;
		}

		this.#setActionWidget(null);

		this.cancelDrop();
		this.restorePreGrabSnapshot();
		this.applyGridPostCompletionOperations();
	}

	onWidgetRelease(event: InternalWidgetEvent) {
		const provider = this.provider$();
		if (event.board != provider || !this.actionWidget) {
			return;
		}

		const actionWidget = this.actionWidget;

		// Capture the original source target BEFORE tryDropWidget updates the widget target
		const originalSourceTarget = actionWidget.widget.internalTarget;

		// We're trying to drop it on our target, so check this is possible.
		const succeeded = this.tryDropWidget(actionWidget.widget);

		if (!succeeded) {
			return;
		}
		this.#eventBus.dispatch('widget:dropped', {
			widget: actionWidget.widget,
			board: provider,
			oldTarget: originalSourceTarget,
			newTarget: this
		});
	}

	onWidgetDropped(event: InternalWidgetDroppedEvent) {
		// No-op if the widget was dropped back onto the same target
		if (event.newTarget == event.oldTarget) {
			return;
		}

		// If this was the source target, then we need to remove the widget from it.
		if (event.oldTarget == this) {
			// Ensure the widget is no longer tracked by this (source) target
			this.#widgets$().delete(event.widget);
			trigger(() => this.#widgets$());
			// Update the ordered widgets list to reflect the removal
			this.#updateOrderedWidgets();
			// Clear any pre-grab snapshot now that the operation completed successfully
			this.forgetPreGrabSnapshot();
			// Apply any deferred grid operations (e.g., row/column collapsing)
			this.applyGridPostCompletionOperations();
		}
	}

	onWidgetEnterTarget(event: InternalWidgetEvent) {
		if (event.target != this) {
			return;
		}

		this.#setActionWidget({
			action: 'grab',
			widget: event.widget
		});

		this.#createDropzoneWidget();
	}

	onWidgetLeaveTarget(event: InternalWidgetEvent) {
		if (event.target != this) {
			return;
		}

		this.#setActionWidget(null);
		this.#removeDropzoneWidget();
	}

	oninitialloadcomplete() {
		for (const registration of this.#initialWidgetRegistrations) {
			const widget = this.createWidget(registration.config);
			if (widget && registration.onCreated) {
				registration.onCreated(widget);
			}
		}

		this.#state$().prepared = true;
		trigger(() => this.#state$());
	}

	#updateOrderedWidgets() {
		this.#orderedWidgets$(Array.from(this.internalWidgets).toSorted((a, b) => {
			if (a.y !== b.y) {
				return a.y - b.y;
			}

			return a.x - b.x;
		}));
	}

	#updateMouseCellPosition(x: number, y: number) {
		this.#mouseCellPosition.x = x;
		this.#mouseCellPosition.y = y;
	}

	#createDropzoneWidget() {
		if (this.dropzoneWidget || !this.actionWidget) {
			return;
		}
		const grid = this.grid;

		// Take a snapshot of the grid so we can restore its state if the hover stops.
		this.#gridSnapshot = grid.takeSnapshot();
		grid.setDragSnapshot(this.#gridSnapshot);

		// TODO: Not sure why the $effect.root is needed, but it is.
		this.#dropzoneWidgetDestroy = $effect.root(() => {
			this.dropzoneWidget = this.#createShadow(this.actionWidget!.widget, this.actionWidget!.action);
		});

		let [x, y, width, height] = this.#getDropzoneLocation(this.actionWidget);

		const added = this.grid.tryPlaceWidget(this.dropzoneWidget!, x, y, width, height, true);

		if (added) {
			this.widgets.add(this.dropzoneWidget!);
			this.#isDropzoneWidgetAdded$(true);
		}

		// TODO: patch - dropzone widget doesn't reflect the classes of the target it's being moved under.
		// if (added) {
		// 	this.widgets.add(this.dropzoneWidget);
		// 	this.dropzoneWidget.target = this;
		// }
	}

	#updateDropzoneWidget() {
		const dropzoneWidget = this.dropzoneWidget;
		const actionWidget = this.actionWidget;

		if (!dropzoneWidget || !actionWidget) {
			return;
		}

		let [x, y, width, height] = this.#getDropzoneLocation(actionWidget);

		const grid = this.grid;

		// No change, no need to update.
		if (
			x === dropzoneWidget.x &&
			y === dropzoneWidget.y &&
			width === dropzoneWidget.width &&
			height === dropzoneWidget.height
		) {
			return;
		}

		grid.removeWidget(dropzoneWidget);
		grid.restoreFromSnapshot(this.#gridSnapshot!);

		const added = grid.tryPlaceWidget(dropzoneWidget, x, y, width, height, true);

		if (!added && this.#isDropzoneWidgetAdded$()) {
			this.widgets.delete(this.dropzoneWidget!);
			this.#isDropzoneWidgetAdded$(false);
		} else if (added && !this.#isDropzoneWidgetAdded$()) {
			this.widgets.add(this.dropzoneWidget!);
			this.#isDropzoneWidgetAdded$(true);
		}
	}

	#getDropzoneLocation(actionWidget: FlexiTargetActionWidget) {
		const mouseCellPosition = this.#mouseCellPosition;

		switch (actionWidget.action) {
			case 'grab':
				return this.#getGrabbedDropzoneLocation(actionWidget.widget, mouseCellPosition);
			case 'resize':
				return this.#getResizingDropzoneLocation(actionWidget.widget, mouseCellPosition);
		}
	}

	#getGrabbedDropzoneLocation(
		grabbedWidget: FlexiWidgetController,
		mouseCellPosition: Position
	): [x: number, y: number, width: number, height: number] {
		return [mouseCellPosition.x, mouseCellPosition.y, grabbedWidget.width, grabbedWidget.height];
	}

	#getResizingDropzoneLocation(
		resizingWidget: FlexiWidgetController,
		mouseCellPosition: Position
	): [x: number, y: number, width: number, height: number] {
		const { width, height } = this.#getNewWidgetHeightAndWidth(resizingWidget, mouseCellPosition);

		return [resizingWidget.x, resizingWidget.y, width, height];
	}

	#getNewWidgetHeightAndWidth(widget: FlexiWidgetController, mouseCellPosition: Position) {
		const grid = this.grid;

		// Use raw (fractional) position with rounding for smoother resize snapping
		// This makes the widget snap to the next cell when more than halfway through
		const rawMouseCellPosition = this.#rawMouseCellPosition$();
		const roundedX = Math.round(rawMouseCellPosition.x);
		const roundedY = Math.round(rawMouseCellPosition.y);

		let newWidth = Math.max(1, Math.min(widget.maxWidth, Math.max(roundedX - widget.x, widget.minWidth)));
		let newHeight = Math.max(1, Math.min(widget.maxHeight, Math.max(roundedY - widget.y, widget.minHeight)));

		// If the widget is in a flow layout, then they can't change their flow axis dimensions.
		// NEXT: show this visually to the user by faking the "horizontal"/"vertical" resizable modes.
		if (this.config.layout.type == 'flow' && this.config.layout.flowAxis == 'row') {
			newHeight = widget.height;
		} else if (this.config.layout.type == 'flow' && this.config.layout.flowAxis == 'column') {
			newWidth = widget.width;
		}

		switch (widget.resizability) {
			case 'horizontal':
				return { width: newWidth, height: widget.height };
			case 'vertical':
				return { width: widget.width, height: newHeight };
			case 'both':
				return { width: newWidth, height: newHeight };
		}

		return { width: widget.width, height: widget.height };
	}

	#removeDropzoneWidget() {
		if (!this.dropzoneWidget) {
			return;
		}

		const dropzoneWidget = this.dropzoneWidget;
		const grid = this.grid;

		grid.removeWidget(dropzoneWidget);
		if (this.#isDropzoneWidgetAdded$()) {
			this.widgets.delete(dropzoneWidget);
			this.#isDropzoneWidgetAdded$(false);
		}

		grid.restoreFromSnapshot(this.#gridSnapshot!);
		grid.clearDragSnapshot();
		this.#gridSnapshot = null;

		this.dropzoneWidget = null;
		this.#dropzoneWidgetDestroy?.();
		this.#dropzoneWidgetDestroy = null;

		// Clean up the shadow widget's event subscriptions and reset counters
		dropzoneWidget.destroy();
	}

	// State-related getters and setters

	/**
	 * Whether the target is currently being hovered over by the mouse.
	 */
	get hovered() {
		return this.#state$().hovered;
	}

	#setHovered(value: boolean) {
		this.#state$().hovered = value;
		trigger(() => this.#state$());
	}

	/**
	 * When set, this indicates that a widget is currently being hovered over this target.
	 */
	get actionWidget() {
		return this.#state$().actionWidget;
	}

	#setActionWidget(value: FlexiTargetActionWidget | null) {
		this.#state$().actionWidget = value;
		trigger(() => this.#state$());
	}

	/**
	 * Whether the target is prepared and ready to render widgets.
	 */
	get prepared() {
		return this.#state$().prepared;
	}

	/**
	 * The number of columns currently being used in the target grid.
	 * This value is readonly.
	 */
	get columns() {
		return this.#grid?.columns ?? 0;
	}

	/**
	 * The number of rows currently being used in the target grid.
	 * This value is readonly.
	 */
	get rows() {
		return this.#grid?.rows ?? 0;
	}

	get grid() {
		const grid = this.#grid;
		if (!grid) {
			throw new Error(
				'Grid is not initialised. Ensure that a FlexiGrid has been created before accessing it.'
			);
		}
		return grid;
	}

	get dropzoneWidget() {
		return this.#dropzoneWidget$().value;
	}

	set dropzoneWidget(value: InternalFlexiWidgetController | null) {
		this.#dropzoneWidget$(value);
	}

	get shouldRenderDropzoneWidget() {
		return this.#isDropzoneWidgetAdded$() && !!this.dropzoneWidget;
	}

	get widgets() {
		return this.#widgets$() as Set<FlexiWidgetController>;
	}

	get internalWidgets() {
		return this.#widgets$();
	}
	get orderedWidgets() {
		return this.#orderedWidgets$();
	}

	/**
	 * Cleanup method to be called when the target is destroyed
	 */
	destroy() {
		// Clean up all widgets
		this.#widgets$().forEach((widget) => {
			widget.destroy();
		});
		this.#widgets$().clear();
		trigger(() => this.#widgets$());

		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}
}
