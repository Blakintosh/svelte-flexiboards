import { getContext, setContext, untrack } from 'svelte';
import {
	getFlexiboardCtx,
	getInternalFlexiboardCtx,
	InternalFlexiBoardController
} from './provider.svelte.js';
import {
	type FlexiWidgetConfiguration,
	type FlexiWidgetDefaults,
	FlexiWidgetController
} from './widget.svelte.js';
import type {
	GrabbedWidgetMouseEvent,
	MouseGridCellMoveEvent,
	Position,
	ProxiedValue,
	WidgetAction,
	WidgetDroppedEvent,
	WidgetGrabAction,
	WidgetGrabbedParams,
	WidgetStartResizeParams
} from './types.js';
import { SvelteSet } from 'svelte/reactivity';
import { FlowFlexiGrid, type FlowTargetLayout } from './grid/index.js';
import { FreeFormFlexiGrid, type FreeFormTargetLayout } from './grid/free-grid.svelte.js';
import { type FlexiGrid } from './grid/index.js';
import type { FlexiTargetProps } from '$lib/components/flexi-target.svelte';
import { getPointerService } from './utils.svelte.js';

type TargetSizingFn = ({
	target,
	grid
}: {
	target: FlexiTargetController;
	grid: FlexiGrid;
}) => string;
export type TargetSizing = TargetSizingFn | string;

export type FlexiTargetDefaults = {
	/**
	 * Allows the specifying of the value inside the `repeat()` function of the `grid-template-rows` CSS property for the target.
	 */
	rowSizing?: TargetSizing;
	/**
	 * Allows the specifying of the value inside the `repeat()` function of the `grid-template-columns` CSS property for the target.
	 */
	columnSizing?: TargetSizing;

	/**
	 * The layout algorithm and parameters to use for the target grid.
	 */
	layout?: TargetLayout;

	/**
	 * The number of rows to use for the target grid.
	 * @deprecated This property will be removed in v0.3. Use `layout.minRows` instead.
	 */
	baseRows?: number;

	/**
	 * The number of columns to use for the target grid.
	 * @deprecated This property will be removed in v0.3. Use `layout.minColumns` instead.
	 */
	baseColumns?: number;
};

// Exclude deprecated properties
type RequiredFlexiTargetProperties = Omit<
	Required<FlexiTargetDefaults>,
	'baseRows' | 'baseColumns'
>;

export type FlexiTargetPartialConfiguration = FlexiTargetDefaults & {
	widgetDefaults?: FlexiWidgetDefaults;
};

export type FlexiTargetConfiguration = RequiredFlexiTargetProperties &
	// Don't make these mandatory, as they're deprecatedß
	Pick<FlexiTargetDefaults, 'baseRows' | 'baseColumns'> & {
		widgetDefaults?: FlexiWidgetDefaults;
	};

export type TargetLayout = FlowTargetLayout | FreeFormTargetLayout;

export interface FlexiTargetController {
	/**
	 * The widgets currently in this target.
	 */
	widgets: SvelteSet<FlexiWidgetController>;

	/**
	 * The reactive configuration of the target.
	 */
	config: FlexiTargetConfiguration;

	/**
	 * The reactive default widget configuration passed through from the provider, if it exists.
	 */
	providerWidgetDefaults?: FlexiWidgetDefaults;

	/**
	 * Whether the target is prepared and ready to render widgets.
	 */
	get prepared(): boolean;

	/**
	 * Creates a new widget under this target.
	 * @param config The configuration of the widget to create.
	 * @returns The newly created widget if it could be placed, or undefined if not.
	 */
	createWidget(config: FlexiWidgetConfiguration): FlexiWidgetController | undefined;

	/**
	 * Deletes the given widget from this target, if it exists.
	 * @returns Whether the widget was deleted.
	 */
	deleteWidget(widget: FlexiWidgetController): boolean;

	// NEXT: Add import/export layout.
	// /**
	//  * Imports a layout of widgets into this target, replacing any existing widgets.
	//  * @param layout The layout to import.
	//  */
	// importLayout(layout: FlexiWidgetConfiguration[]): void;

	// /**
	//  * Exports the current layout of widgets from this target.
	//  * @returns The layout of widgets.
	//  */
	// exportLayout(): FlexiWidgetConfiguration[];

	/**
	 * Restores the target to its pre-grab state.
	 * @remarks This is not intended for external use.
	 */
	restorePreGrabSnapshot(): void;

	/**
	 * Forgets the pre-grab state of the target.
	 * @remarks This is not intended for external use.
	 */
	forgetPreGrabSnapshot(): void;

	/**
	 * Cancels the current drop action.
	 */
	cancelDrop(): void;

	/**
	 * Applies any post-completion operations like row/column collapsing.
	 */
	applyGridPostCompletionOperations(): void;

	/**
	 * Attempts to drop a widget into this target.
	 * @param widget The widget to drop.
	 * @returns Whether the widget was dropped.
	 */
	tryDropWidget(widget: FlexiWidgetController): boolean;

	/**
	 * Grabs a widget.
	 * @param params The parameters for the grab action.
	 * @returns The action that was started, or null if the action couldn't be started.
	 */
	grabWidget(params: WidgetGrabbedParams): WidgetAction | null;

	/**
	 * Starts resizing a widget.
	 * @param params The parameters for the resize action.
	 * @returns The action that was started, or null if the action couldn't be started.
	 */
	startResizeWidget(params: WidgetStartResizeParams): WidgetAction | null;
}

export class InternalFlexiTargetController implements FlexiTargetController {
	widgets: SvelteSet<FlexiWidgetController> = $state(new SvelteSet());

	provider: InternalFlexiBoardController = $state() as InternalFlexiBoardController;

	#providerTargetDefaults?: FlexiTargetDefaults = $derived(this.provider?.config?.targetDefaults);
	providerWidgetDefaults?: FlexiWidgetDefaults = $derived(this.provider?.config?.widgetDefaults);

	/**
	 * Stores the underlying state of the target.
	 */
	#state: FlexiTargetState = $state({
		hovered: false,
		actionWidget: null,
		prepared: false
	});

	#dropzoneWidget: ProxiedValue<FlexiWidgetController | null> = $state({
		value: null
	});

	#mouseCellPosition: Position = $state({
		x: 0,
		y: 0
	});

	key: string;

	#grid: FlexiGrid | null = null;

	#preGrabSnapshot: unknown | null = null;
	#gridSnapshot: unknown | null = null;

	#targetConfig?: FlexiTargetPartialConfiguration = $state(undefined);

	#pointerService = getPointerService();

	config: FlexiTargetConfiguration = $derived({
		layout: this.#targetConfig?.layout ??
			this.#providerTargetDefaults?.layout ?? {
				type: 'flow',
				flowAxis: 'row',
				placementStrategy: 'append'
			},
		rowSizing:
			this.#targetConfig?.rowSizing ??
			this.#providerTargetDefaults?.rowSizing ??
			'minmax(1rem, auto)',
		columnSizing:
			this.#targetConfig?.columnSizing ??
			this.#providerTargetDefaults?.columnSizing ??
			'minmax(0, 1fr)',
		widgetDefaults: this.#targetConfig?.widgetDefaults,
		baseRows: this.#targetConfig?.baseRows ?? this.#providerTargetDefaults?.baseRows ?? 1,
		baseColumns: this.#targetConfig?.baseColumns ?? this.#providerTargetDefaults?.baseColumns ?? 1
	});

	constructor(
		provider: InternalFlexiBoardController,
		key: string,
		config?: FlexiTargetPartialConfiguration
	) {
		this.provider = provider;
		this.#targetConfig = config;
		this.key = key;

		// Track pointer position changes to emulate pointer enter/leave events for keyboard controls
		$effect(() => {
			const { x, y } = this.#pointerService.position;
			
			// Only check when keyboard controls are active
			untrack(() => {
				this.#checkPointerOverTarget(x, y);
			});
		});
	}

	/**
	 * Checks if the pointer is over this target's DOM element and triggers enter/leave events as needed.
	 */
	#checkPointerOverTarget(clientX: number, clientY: number) {
		if (typeof window === 'undefined' || !this.#grid?.ref) {
			return;
		}

		const targetElement = this.#grid.ref;
		const rect = targetElement.getBoundingClientRect();
		
		const isPointerOver = 
			clientX >= rect.left && 
			clientX <= rect.right && 
			clientY >= rect.top && 
			clientY <= rect.bottom;

		const wasHovered = this.hovered;

		if (isPointerOver && !wasHovered) {
			// Pointer entered the target
			this.onpointerenter();
		} else if (!isPointerOver && wasHovered) {
			// Pointer left the target
			this.onpointerleave();
		}
	}

	#tryAddWidget(
		widget: FlexiWidgetController,
		x?: number,
		y?: number,
		width?: number,
		height?: number
	): boolean {
		const added = this.grid.tryPlaceWidget(widget, x, y, width, height);

		if (added) {
			this.widgets.add(widget);
			widget.target = this;
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
		const widget = new FlexiWidgetController({
			type: 'target',
			target: this,
			config
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

	/**
	 * Deletes the given widget from this target, if it exists.
	 * @returns Whether the widget was deleted.
	 */
	deleteWidget(widget: FlexiWidgetController): boolean {
		const deleted = this.widgets.delete(widget);
		this.grid.removeWidget(widget);

		// Apply any deferred operations like row collapsing now that the operation is complete
		this.applyGridPostCompletionOperations();

		return deleted;
	}

	/**
	 * Imports a layout of widgets into this target, replacing any existing widgets.
	 * @param layout The layout to import.
	 */
	importLayout(layout: FlexiWidgetConfiguration[]) {
		this.widgets.clear();
		this.grid.clear();

		for (const config of layout) {
			this.createWidget(config);
		}
	}

	/**
	 * Exports the current layout of widgets from this target.
	 * @returns The layout of widgets.
	 */
	exportLayout(): FlexiWidgetConfiguration[] {
		const result: FlexiWidgetConfiguration[] = [];

		// Likely much more information than needed, but we've got it.
		for (const widget of this.widgets) {
			result.push({
				component: widget.component,
				componentProps: widget.componentProps,
				snippet: widget.snippet,
				width: widget.width,
				height: widget.height,
				x: widget.x,
				y: widget.y,
				draggable: widget.draggable,
				resizability: widget.resizability,
				className: widget.className,
				metadata: widget.metadata
			});
		}

		return result;
	}

	#createShadow(of: FlexiWidgetController) {
		const shadow = new FlexiWidgetController({
			type: 'target',
			target: this,
			config: {
				width: of.width,
				height: of.height,
				component: of.component,
				draggable: of.draggable,
				resizability: of.resizability,
				snippet: of.snippet,
				className: of.className,
				componentProps: of.componentProps
			},
			isShadow: true
		});
		this.widgets.add(shadow);

		return shadow;
	}

	// Events
	onpointerenter() {
		this.hovered = true;

		this.provider.onpointerentertarget({
			target: this
		});
	}

	onpointerleave() {
		this.hovered = false;

		this.provider.onpointerleavetarget({
			target: this
		});
	}

	grabWidget(params: WidgetGrabbedParams) {
		// Take a snapshot of the grid before the widget is removed, so if the widget is not successfully placed
		// we can restore the grid to its original state.
		this.#preGrabSnapshot = this.grid.takeSnapshot();

		// Remove the widget from the grid as it's now in a floating state.
		this.grid.removeWidget(params.widget);
		this.grid.forceUpdatePointerPosition(params.clientX, params.clientY);

		return this.provider.onwidgetgrabbed({
			...params,
			target: this
		});
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

	applyGridPostCompletionOperations(): void {
		this.grid.applyPostCompletionOperations();
	}

	startResizeWidget(params: WidgetStartResizeParams) {
		// Remove the widget as it's now in a pseudo-floating state.
		this.grid.removeWidget(params.widget);

		const result = this.provider.onwidgetstartresize({
			...params,
			target: this
		});

		if (result) {
			this.actionWidget = {
				action: 'resize',
				widget: params.widget
			};

			this.#createDropzoneWidget();
		}

		return result;
	}

	cancelDrop() {
		this.actionWidget = null;
		this.#removeDropzoneWidget();
	}

	tryDropWidget(widget: FlexiWidgetController): boolean {
		const actionWidget = this.actionWidget;
		if (!actionWidget) {
			return false;
		}

		let [x, y, width, height] = this.#getDropzoneLocation(actionWidget);

		// Ensure width and height are at least 1 grid unit.
		width = Math.max(1, width);
		height = Math.max(1, height);

		this.actionWidget = null;
		this.#removeDropzoneWidget();

		// Try to formally place the widget in the grid, which will also serve as a final check that
		// the drop is possible.
		const result = this.#tryAddWidget(widget, x, y, width, height);

		// Apply any deferred operations like row collapsing now that the operation is complete
		this.applyGridPostCompletionOperations();

		return result;
	}

	onmousegridcellmove(event: MouseGridCellMoveEvent) {
		this.#updateMouseCellPosition(event.cellX, event.cellY);
		this.#updateDropzoneWidget();
	}

	ongrabbedwidgetover(event: GrabbedWidgetMouseEvent) {
		this.actionWidget = {
			action: 'grab',
			widget: event.widget
		};

		this.#createDropzoneWidget();
	}

	ongrabbedwidgetleave() {
		this.actionWidget = null;
		this.#removeDropzoneWidget();
	}

	oninitialloadcomplete() {
		this.#state.prepared = true;
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

		const dropzoneWidget = this.#createShadow(this.actionWidget.widget);
		this.dropzoneWidget = dropzoneWidget;

		let [x, y, width, height] = this.#getDropzoneLocation(this.actionWidget);

		const added = this.grid.tryPlaceWidget(this.dropzoneWidget, x, y, width, height);

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

		grid.tryPlaceWidget(dropzoneWidget, x, y, width, height);
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

		let newWidth = mouseCellPosition.x - widget.x;
		let newHeight = mouseCellPosition.y - widget.y;

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

		const grid = this.grid;

		grid.removeWidget(this.dropzoneWidget);
		this.widgets.delete(this.dropzoneWidget);

		grid.restoreFromSnapshot(this.#gridSnapshot!);
		this.#gridSnapshot = null;

		this.dropzoneWidget = null;
	}

	// State-related getters and setters

	/**
	 * Whether the target is currently being hovered over by the mouse.
	 */
	get hovered() {
		return this.#state.hovered;
	}

	set hovered(value: boolean) {
		this.#state.hovered = value;
	}

	/**
	 * When set, this indicates that a widget is currently being hovered over this target.
	 */
	get actionWidget() {
		return this.#state.actionWidget;
	}

	set actionWidget(value: FlexiTargetActionWidget | null) {
		this.#state.actionWidget = value;
	}

	/**
	 * Whether the target is prepared and ready to render widgets.
	 */
	get prepared() {
		return this.#state.prepared;
	}

	/**
	 * The number of columns currently being used in the target grid.
	 * This value is readonly.
	 */
	get columns() {
		return this.#grid?.columns;
	}

	/**
	 * The number of rows currently being used in the target grid.
	 * This value is readonly.
	 */
	get rows() {
		return this.#grid?.rows;
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
		return this.#dropzoneWidget.value;
	}

	set dropzoneWidget(value: FlexiWidgetController | null) {
		this.#dropzoneWidget.value = value;
	}
}

type FlexiTargetActionWidget = {
	action: WidgetAction['action'];
	widget: FlexiWidgetController;
};

type FlexiTargetState = {
	/**
	 * Whether the target is currently being hovered over by the mouse.
	 */
	hovered: boolean;

	/**
	 * When set, this indicates a widget action that is currently being performed (or is focused) on this target.
	 */
	actionWidget: FlexiTargetActionWidget | null;

	/**
	 * Whether the target is mounted and ready to render widgets.
	 */
	prepared: boolean;
};

const contextKey = Symbol('flexitarget');

/**
 * Creates a new {@link FlexiTargetController} instance in the context of the current FlexiBoard.
 * @returns A {@link FlexiTargetController} instance.
 */
export function flexitarget(config?: FlexiTargetPartialConfiguration, key?: string) {
	const provider = getInternalFlexiboardCtx();
	const target = provider.createTarget(config, key);

	setContext(contextKey, target);

	return {
		target: target as FlexiTargetController
	};
}

/**
 * Gets the current {@link InternalFlexiTargetController} instance, if any. Throws an error if no target is found.
 * @internal
 * @returns An {@link InternalFlexiTargetController} instance.
 */
export function getInternalFlexitargetCtx() {
	const target = getContext<InternalFlexiTargetController | undefined>(contextKey);

	// No provider to attach to.
	if (!target) {
		throw new Error(
			'Cannot get FlexiTarget context outside of a registered target. Ensure that flexitarget() (or <FlexiTarget>) is called within a <FlexiBoard> component.'
		);
	}

	return target;
}

/**
 * Gets the current {@link FlexiTargetController} instance, if any. Throws an error if no target is found.
 * @returns A {@link FlexiTargetController} instance.
 */
export function getFlexitargetCtx() {
	return getInternalFlexitargetCtx() as FlexiTargetController;
}
