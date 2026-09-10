import { FlexiGrid, type WidgetSnapshot } from '../grid/base.js';
import { FlowFlexiGrid } from '../grid/flow-grid.js';
import type {
	InternalTargetEvent,
	InternalWidgetDroppedEvent,
	InternalWidgetEvent,
	InternalWidgetGrabbedEvent,
	InternalWidgetResizingEvent
} from '../internal-types.js';
import type { MouseGridCellMoveEvent, Position } from '../types.js';
import { FlexiWidgetController } from '../widget/base.js';
import { InternalFlexiWidgetController } from '../widget/controller.js';
import type { FlexiWidgetConfiguration, FlexiWidgetDefaults } from '../widget/types.js';
import type { InternalFlexiBoardController } from '../board/controller.js';
import { getFlexiEventBus, type FlexiEventBus } from '../shared/event-bus.js';
import type { FlexiTargetController } from './base.js';
import { ReactiveSet } from '../shared/reactive-collections.js';
import type {
	FlexiTargetActionWidget,
	FlexiTargetConfiguration,
	FlexiTargetDefaults,
	FlexiTargetPartialConfiguration
} from './types.js';
import { getPointerService } from '../shared/utils.js';
import type { FlexiRegistryEntry, FlexiWidgetLayoutEntry } from '../board/types.js';
import { FreeFormFlexiGrid } from '../grid/free-grid.js';
import {
	computed,
	effect,
	effectScope,
	signal,
	trigger,
	untracked,
	type ReadonlySignal,
	type Signal
} from '../reactivity.js';
import { shallowEqual } from '../shared/prop-sync.js';

export class InternalFlexiTargetController implements FlexiTargetController {
	#widgets: ReactiveSet<InternalFlexiWidgetController> = new ReactiveSet();
	#orderedWidgets$: Signal<InternalFlexiWidgetController[]> = signal([]);

	provider$: Signal<InternalFlexiBoardController> = signal(
		undefined as unknown as InternalFlexiBoardController
	);

	#eventBus: FlexiEventBus;
	#unsubscribers: (() => void)[] = [];
	#stopEffects: (() => void)[] = [];

	#providerTargetDefaults$: ReadonlySignal<FlexiTargetDefaults | undefined> = computed(
		() => this.provider$()?.config$()?.targetDefaults
	);
	providerWidgetDefaults$: ReadonlySignal<FlexiWidgetDefaults | undefined> = computed(
		() => this.provider$()?.config$()?.widgetDefaults
	);

	#initialWidgetRegistrations: Array<{
		config: FlexiWidgetConfiguration;
		onCreated?: (widget: FlexiWidgetController) => void;
	}> = [];

	/**
	 * Stores the underlying state of the target.
	 */
	#hovered$: Signal<boolean> = signal(false);
	#actionWidget$: Signal<FlexiTargetActionWidget | null> = signal(null);
	#prepared$: Signal<boolean> = signal(false);

	#dropzoneWidget$: Signal<InternalFlexiWidgetController | null> = signal(null);
	#dropzoneWidgetDestroy: (() => void) | null = null;
	#isDropzoneWidgetAdded$: Signal<boolean> = signal(false);
	#dropRejected$: Signal<boolean> = signal(false);
	/** The widget currently flagged as rejected, so the flag can be cleared after the action ends. */
	#dropRejectedWidget: InternalFlexiWidgetController | null = null;

	#mouseCellPosition$: Signal<Position> = signal({
		x: 0,
		y: 0
	});

	// Raw (fractional) cell position - used for resize snapping (rounds instead of floors)
	#rawMouseCellPosition$: Signal<Position> = signal({
		x: 0,
		y: 0
	});

	key: string;

	// Signal-backed so effects created before the grid exists (e.g. #trackPointerHover,
	// which runs at construction) re-run once createGrid() assigns it.
	#grid$: Signal<FlexiGrid | null> = signal(null);

	#preGrabSnapshot: unknown | null = null;

	/**
	 * The widget the pre-grab snapshot was taken for. The snapshot predates the
	 * grab, so restoring it brings that widget back — which must not happen once
	 * the widget has been deleted.
	 */
	#preGrabSnapshotWidget: InternalFlexiWidgetController | null = null;
	#gridSnapshot: unknown | null = null;

	#registry$: ReadonlySignal<Record<string, FlexiRegistryEntry> | undefined> = computed(() =>
		this.provider$()?.registry$()
	);

	#targetConfig$: Signal<FlexiTargetPartialConfiguration | undefined> = signal(undefined);

	#pointerService = getPointerService();

	#config$: ReadonlySignal<FlexiTargetConfiguration> = computed(() => ({
		layout: this.#targetConfig$()?.layout ??
			this.#providerTargetDefaults$()?.layout ?? {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append'
			},
		rowSizing:
			this.#targetConfig$()?.rowSizing ??
			this.#providerTargetDefaults$()?.rowSizing ??
			'minmax(1rem, auto)',
		columnSizing:
			this.#targetConfig$()?.columnSizing ??
			this.#providerTargetDefaults$()?.columnSizing ??
			'minmax(0, 1fr)',
		widgetDefaults: this.#targetConfig$()?.widgetDefaults
	}));

	constructor(
		provider: InternalFlexiBoardController,
		key: string,
		config?: FlexiTargetPartialConfiguration
	) {
		this.provider$(provider);
		this.updateConfig(config);
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
		this.#stopEffects.push(
			effect(() => {
				const grid = this.#grid$();
				if (!grid?.ref) {
					return;
				}

				const isPointerInside = this.#pointerService.isPointerInside(grid.ref);

				// Only check when keyboard controls are active
				untracked(() => {
					this.#updatePointerOverState(isPointerInside);
				});
			})
		);
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
			this.widgets.add(widget);
			this.#updateOrderedWidgets();
			widget.target = this;
			widget.internalTarget = this;
		}
		return added;
	}

	/**
	 * Returns the target's grid, creating it if it doesn't exist yet. The grid
	 * controller is pure placement logic (its DOM element attaches later via
	 * `grid.ref`), so it can be created before the grid component renders —
	 * initial widget creation needs it ahead of that during SSR.
	 */
	ensureGrid() {
		return this.#grid$() ?? this.createGrid();
	}

	createGrid() {
		if (this.#grid$()) {
			console.warn(
				'A grid already exists but is being replaced. If this is due to a hot reload, this is no cause for alarm.'
			);
		}

		const layout = this.config.layout;
		let grid: FlexiGrid;
		switch (layout.type) {
			case 'free':
				grid = new FreeFormFlexiGrid(this, this.config);
				break;
			case 'flow':
				grid = new FlowFlexiGrid(this, this.config);
				break;
		}
		this.#grid$(grid);
		return grid;
	}

	/**
	 * Updates the configuration backing this target's reactive state.
	 * The adapter's prop seam: call whenever the component's config prop changes.
	 *
	 * Inert when the config is unchanged, so it is safe to call from inside an
	 * adapter effect — see InternalFlexiBoardController.updateProps.
	 */
	updateConfig(config?: FlexiTargetPartialConfiguration): void {
		const previous = untracked(() => this.#targetConfig$());

		if (shallowEqual(previous, config, 1)) {
			return;
		}

		// Fresh identity so the `#config$` computed actually recomputes.
		this.#targetConfig$(config ? { ...config } : config);
	}

	createWidget(config: FlexiWidgetConfiguration) {
		const [x, y, width, height] = [config.x, config.y, config.width, config.height];

		let widgetConfig = {};

		if (config.type) {
			if (!this.registry?.[config.type]) {
				console.warn(
					'createWidget(): widget with type ',
					config.type,
					' not found in registry, it will be missing settings.'
				);
			} else {
				widgetConfig = { ...this.registry[config.type] };
			}
		}

		const widget = new InternalFlexiWidgetController({
			config: { ...widgetConfig, ...config },
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

		// A widget added after the initial load, and not as part of an import,
		// is a layout change in its own right.
		if (this.prepared && !this.#importing) {
			this.#eventBus.dispatch('layout:changed', { board: this.provider$() });
		}

		return widget;
	}

	/**
	 * Takes a widget out of this target's grid and bookkeeping without deleting
	 * it, so it can be placed elsewhere. @internal
	 */
	detachWidget(widget: InternalFlexiWidgetController) {
		this.grid.removeWidget(widget);
		this.widgets.delete(widget);
		this.#updateOrderedWidgets();
		this.forgetPreGrabSnapshot();
		this.applyGridPostCompletionOperations();
	}

	/**
	 * Places a widget in this target's grid at a position (or wherever the grid
	 * puts it when none is given). @internal
	 */
	attachWidget(
		widget: InternalFlexiWidgetController,
		x?: number,
		y?: number,
		width?: number,
		height?: number
	): boolean {
		const added = this.#tryAddWidget(widget, x, y, width ?? widget.width, height ?? widget.height);
		if (added) {
			this.applyGridPostCompletionOperations();
		}
		return added;
	}

	clear(): void {
		for (const widget of [...this.internalWidgets]) {
			if (!widget.isShadow) {
				widget.delete();
			}
		}
	}

	registerWidget(
		config: FlexiWidgetConfiguration,
		onCreated?: (widget: FlexiWidgetController) => void
	) {
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
		const deleted = this.widgets.delete(widget);
		this.grid.removeWidget(widget);

		// Update the ordered widgets list to reflect the deletion
		if (deleted) {
			this.#updateOrderedWidgets();
		}

		// TODO: this might not be the best way to handle this. Check whether deleteWidget
		// is still needed.
		// Clean up the widget when it's removed from the target
		if (deleted && 'destroy' in widget) {
			(widget as InternalFlexiWidgetController).destroy();
		}

		// Drop the pre-grab snapshot if it was taken for this widget. The snapshot
		// predates the grab, so the board's safety net would otherwise restore it
		// in a microtask and bring the deleted widget's cells back — leaving it
		// out of this.widgets (so nothing renders it) while it still occupies grid
		// space and collides with everything around it.
		//
		// Keyed on the snapshot's own widget rather than actionWidget, because
		// dropping onto a deleter means the pointer left the target first, and
		// leaving already cleared actionWidget.
		if (this.#preGrabSnapshotWidget === widget) {
			this.forgetPreGrabSnapshot();
		}

		// If the widget is still mid-action here (deleted programmatically rather
		// than via a deleter), end the action and drop the dropzone with it —
		// otherwise our own widget:release subscriber runs next and drops the
		// just-deleted widget straight back into the grid.
		if (this.actionWidget?.widget === widget) {
			this.cancelDrop();
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
	#importing = false;

	importLayout(layout: FlexiWidgetLayoutEntry[]) {
		this.#importing = true;
		try {
			this.#importLayout(layout);
		} finally {
			this.#importing = false;
		}
	}

	#importLayout(layout: FlexiWidgetLayoutEntry[]) {
		if (!this.registry) {
			console.warn(
				'importLayout(): no registry provided, cannot import layout. Provide a registry to the FlexiBoard component.'
			);
			return;
		}

		this.widgets.clear();
		this.grid.clear();

		for (const entry of layout) {
			if (!entry.type) {
				console.warn('importLayout(): skipping widget entry with no type:', entry);
				continue;
			}

			if (!this.registry[entry.type]) {
				console.warn(
					`importLayout(): widget type "${entry.type}" not found in registry, skipping widget.`
				);
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
				const entry: FlexiWidgetLayoutEntry = {
					...(widget.type !== undefined && { type: widget.type }),
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

		this.hovered = true;
	}

	onPointerLeaveTarget(event: InternalTargetEvent) {
		if (event.target != this) {
			return;
		}

		this.hovered = false;
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
		this.#preGrabSnapshotWidget = null;
	}

	hasPreGrabSnapshot(): boolean {
		return this.#preGrabSnapshot !== null;
	}

	applyGridPostCompletionOperations(): void {
		this.grid.applyPostCompletionOperations();
	}

	cancelDrop() {
		this.actionWidget = null;
		this.#removeDropzoneWidget();
	}

	tryDropWidget(widget: InternalFlexiWidgetController): boolean {
		const actionWidget = this.actionWidget;
		if (!actionWidget) {
			return false;
		}

		let [x, y, width, height] = this.#getDropzoneLocation(actionWidget);

		this.actionWidget = null;
		this.#removeDropzoneWidget();

		widget.isBeingDropped = true;

		// Try to formally place the widget in the grid, which will also serve as a final check that
		// the drop is possible. The consumer's canDrop gets the last word before the grid.
		const result =
			this.#consumerAllows(widget, x, y, width, height) &&
			this.#tryAddWidget(widget, x, y, width, height);
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
		this.#rawMouseCellPosition$().x = event.rawCellX;
		this.#rawMouseCellPosition$().y = event.rawCellY;
		trigger(this.#rawMouseCellPosition$);
		this.#updateDropzoneWidget();
	}

	onWidgetGrabbed(event: InternalWidgetGrabbedEvent) {
		// Nothing to do if it's not under this target.
		if (event.target != this) {
			return;
		}

		this.actionWidget = {
			action: 'grab',
			widget: event.widget
		};

		// Take a snapshot of the grid before the widget is removed, so if the widget is not successfully placed
		// we can restore the grid to its original state.
		this.#preGrabSnapshot = this.grid.takeSnapshot();
		this.#preGrabSnapshotWidget = event.widget;

		// Remove the widget from the grid as it's now in a floating state.
		this.grid.removeWidget(event.widget);
		this.grid.forceUpdatePointerPosition(event.clientX, event.clientY);

		this.#createDropzoneWidget();
	}

	onWidgetResizing(event: InternalWidgetResizingEvent) {
		if (event.target != this) {
			return;
		}

		this.actionWidget = {
			action: 'resize',
			widget: event.widget
		};

		// Take a snapshot of the grid before the widget is removed, so if the widget is not successfully placed
		// we can restore the grid to its original state.
		this.#preGrabSnapshot = this.grid.takeSnapshot();
		this.#preGrabSnapshotWidget = event.widget;

		// Remove the widget from the grid as it's now in a floating state.
		this.grid.removeWidget(event.widget);
		this.grid.forceUpdatePointerPosition(event.clientX, event.clientY);

		this.#createDropzoneWidget();
	}

	onWidgetCancel(event: InternalWidgetEvent) {
		if (event.target != this) {
			return;
		}

		this.actionWidget = null;

		this.cancelDrop();
		this.restorePreGrabSnapshot();
		this.applyGridPostCompletionOperations();
	}

	onWidgetRelease(event: InternalWidgetEvent) {
		if (event.board != this.provider$() || !this.actionWidget) {
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
			board: this.provider$(),
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
			this.widgets.delete(event.widget);
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

		this.actionWidget = {
			action: 'grab',
			widget: event.widget
		};

		this.#createDropzoneWidget();
	}

	onWidgetLeaveTarget(event: InternalWidgetEvent) {
		if (event.target != this) {
			return;
		}

		this.actionWidget = null;
		this.#removeDropzoneWidget();
	}

	/**
	 * Resets the target to its pre-render state. Server-only: Svelte's SSR
	 * compiles any component that writes to a `bind:` into a settle loop that
	 * renders it again and keeps only the final payload — but this controller
	 * lives outside the payload, so without a reset the repeated render would
	 * re-register and re-create every widget on top of the first pass's,
	 * server-rendering each of them twice.
	 */
	resetForRepeatedServerRender() {
		this.#initialWidgetRegistrations.length = 0;
		this.widgets.clear();
		this.#grid$()?.clear();
		this.#updateOrderedWidgets();
		this.#prepared$(false);
	}

	oninitialloadcomplete() {
		// Initial creation can run before the grid component has rendered (the
		// SSR/first-pass ordering); placement needs the grid controller now.
		this.ensureGrid();

		// Consume the queue so a repeated call (e.g. React StrictMode re-running
		// a mount effect) cannot create duplicate widgets.
		const registrations = this.#initialWidgetRegistrations.splice(0);

		// A configured initialLayout is data the caller already has (e.g.
		// fetched in a server load), so it takes this target's place in the
		// render pass — server and client alike — instead of the declared
		// widgets. The queue is still consumed above so declared registrations
		// can't leak into a later load.
		const initialLayout = untracked(() => this.provider$()?.initialLayoutFor(this.key));
		if (initialLayout) {
			this.importLayout(initialLayout);
		} else {
			for (const registration of registrations) {
				const widget = this.createWidget(registration.config);
				if (widget && registration.onCreated) {
					registration.onCreated(widget);
				}
			}
		}

		this.#prepared$(true);
	}

	#updateOrderedWidgets() {
		this.#orderedWidgets$(
			Array.from(this.internalWidgets).toSorted((a, b) => {
				if (a.y !== b.y) {
					return a.y - b.y;
				}

				return a.x - b.x;
			})
		);
	}

	#updateMouseCellPosition(x: number, y: number) {
		this.#mouseCellPosition$().x = x;
		this.#mouseCellPosition$().y = y;
		trigger(this.#mouseCellPosition$);
	}

	/** Where the action widget sat in this grid before it was grabbed, if it came from here. */
	#dragOrigin(): Position | null {
		const widget = this.actionWidget?.widget;
		if (!widget || this.#preGrabSnapshotWidget !== widget) {
			return null;
		}
		const entry = (this.#preGrabSnapshot as { widgets?: WidgetSnapshot[] } | null)?.widgets?.find(
			(s) => s.widget === widget
		);
		return entry ? { x: entry.x, y: entry.y } : null;
	}

	/** The board's `canDrop`, if the consumer gave one; the preview shows its verdict. */
	#consumerAllows(
		widget: InternalFlexiWidgetController,
		x: number,
		y: number,
		width: number,
		height: number
	): boolean {
		return this.provider$()?.canDrop(widget, this, { x, y, width, height }) ?? true;
	}

	#createDropzoneWidget() {
		if (this.dropzoneWidget || !this.actionWidget) {
			return;
		}
		const grid = this.grid;

		// Take a snapshot of the grid so we can restore its state if the hover stops.
		this.#gridSnapshot = grid.takeSnapshot();
		grid.setDragSnapshot(this.#gridSnapshot, this.#dragOrigin());

		// TODO: Not sure why the $effect.root is needed, but it is.
		this.#dropzoneWidgetDestroy = effectScope(() => {
			this.dropzoneWidget = this.#createShadow(
				this.actionWidget!.widget,
				this.actionWidget!.action
			);
		});

		let [x, y, width, height] = this.#getDropzoneLocation(this.actionWidget);

		const added =
			this.#consumerAllows(this.actionWidget.widget, x, y, width, height) &&
			this.grid.tryPlaceWidget(this.dropzoneWidget!, x, y, width, height, true);
		this.#setDropRejected(!added);

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

		// No change, no need to update — unless the last attempt failed, in which case the
		// dropzone's bounds are stale (they still describe its last *successful* placement)
		// and the position must be re-evaluated.
		if (
			this.#isDropzoneWidgetAdded$() &&
			x === dropzoneWidget.x &&
			y === dropzoneWidget.y &&
			width === dropzoneWidget.width &&
			height === dropzoneWidget.height
		) {
			return;
		}

		grid.removeWidget(dropzoneWidget);
		grid.restoreFromSnapshot(this.#gridSnapshot!);

		const added =
			this.#consumerAllows(actionWidget.widget, x, y, width, height) &&
			grid.tryPlaceWidget(dropzoneWidget, x, y, width, height, true);
		this.#setDropRejected(!added);

		if (!added && this.#isDropzoneWidgetAdded$()) {
			this.widgets.delete(this.dropzoneWidget!);
			this.#isDropzoneWidgetAdded$(false);
		} else if (added && !this.#isDropzoneWidgetAdded$()) {
			this.widgets.add(this.dropzoneWidget!);
			this.#isDropzoneWidgetAdded$(true);
		}
	}

	#getDropzoneLocation(actionWidget: FlexiTargetActionWidget) {
		const mouseCellPosition = this.#mouseCellPosition$();

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
		const roundedX = Math.round(this.#rawMouseCellPosition$().x);
		const roundedY = Math.round(this.#rawMouseCellPosition$().y);

		let newWidth = Math.max(
			1,
			Math.min(widget.maxWidth, Math.max(roundedX - widget.x, widget.minWidth))
		);
		let newHeight = Math.max(
			1,
			Math.min(widget.maxHeight, Math.max(roundedY - widget.y, widget.minHeight))
		);

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

	/**
	 * Records whether the action widget can be placed where it currently is, mirrors it onto
	 * the widget so its own rendering can react, and announces the transition into rejection.
	 */
	#setDropRejected(rejected: boolean) {
		const wasRejected = this.#dropRejected$();
		this.#dropRejected$(rejected);

		// The action widget may already be gone by the time the flag is cleared (a drop nulls it
		// before the dropzone is removed), so the flagged widget is remembered separately.
		if (this.#dropRejectedWidget && this.#dropRejectedWidget !== this.actionWidget?.widget) {
			this.#dropRejectedWidget.dropRejected = false;
			this.#dropRejectedWidget = null;
		}
		const widget = this.actionWidget?.widget;
		if (widget) {
			widget.dropRejected = rejected;
			this.#dropRejectedWidget = rejected ? widget : null;
		}
		if (rejected && !wasRejected) {
			this.provider$()?.announce('The widget cannot be placed here.');
		}
	}

	#removeDropzoneWidget() {
		this.#setDropRejected(false);
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

	get provider() {
		return this.provider$();
	}

	set provider(value: InternalFlexiBoardController) {
		this.provider$(value);
	}

	get providerWidgetDefaults() {
		return this.providerWidgetDefaults$();
	}

	get registry() {
		return this.#registry$();
	}

	get config() {
		return this.#config$();
	}

	/**
	 * Whether the target is currently being hovered over by the mouse.
	 */
	get hovered() {
		return this.#hovered$();
	}

	set hovered(value: boolean) {
		this.#hovered$(value);
	}

	/**
	 * When set, this indicates that a widget is currently being hovered over this target.
	 */
	get actionWidget() {
		return this.#actionWidget$();
	}

	set actionWidget(value: FlexiTargetActionWidget | null) {
		this.#actionWidget$(value);
	}

	/**
	 * Whether the target is prepared and ready to render widgets.
	 */
	get prepared() {
		return this.#prepared$();
	}

	/**
	 * The number of columns currently being used in the target grid.
	 * This value is readonly.
	 */
	get columns() {
		return this.#grid$()?.columns ?? 0;
	}

	/**
	 * The number of rows currently being used in the target grid.
	 * This value is readonly.
	 */
	get rows() {
		return this.#grid$()?.rows ?? 0;
	}

	get grid() {
		const grid = this.#grid$();
		if (!grid) {
			throw new Error(
				'Grid is not initialised. Ensure that a FlexiGrid has been created before accessing it.'
			);
		}
		return grid;
	}

	get dropzoneWidget() {
		return this.#dropzoneWidget$();
	}

	set dropzoneWidget(value: InternalFlexiWidgetController | null) {
		this.#dropzoneWidget$(value);
	}

	get dropRejected() {
		return this.#dropRejected$();
	}

	get shouldRenderDropzoneWidget() {
		return this.#isDropzoneWidgetAdded$() && !!this.dropzoneWidget;
	}

	get widgets() {
		return this.#widgets as unknown as ReactiveSet<FlexiWidgetController>;
	}

	get internalWidgets() {
		return this.#widgets;
	}
	get orderedWidgets() {
		return this.#orderedWidgets$();
	}

	/**
	 * Cleanup method to be called when the target is destroyed
	 */
	destroy() {
		// Clean up all widgets
		// TODO: this.widgets should be internally accessible as a set of InternalFlexiWidgetController
		this.widgets.forEach((widget) => {
			if ('destroy' in widget) {
				(widget as InternalFlexiWidgetController).destroy();
			}
		});
		this.widgets.clear();

		// Stop effects owned by this controller
		this.#stopEffects.forEach((stop) => stop());
		this.#stopEffects = [];

		// Clean up event subscriptions
		this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
		this.#unsubscribers = [];
	}
}
