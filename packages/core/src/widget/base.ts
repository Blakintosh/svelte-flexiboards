import { FlexiControllerBase } from '../base.js';
import type { FlexiTargetController } from '../target/index.js';
import type {
	FlexiComponent,
	Signal,
	ReadonlySignal,
	WidgetAction,
	WidgetDraggability,
	WidgetResizability
} from '../types.js';
import { computed, signal, trigger, untracked } from '../reactivity.js';
import { changedKeys } from '../shared/prop-sync.js';
import {
	defaultTriggerConfig,
	type FlexiWidgetChildrenSnippet,
	type FlexiWidgetClasses,
	type FlexiWidgetConfiguration,
	type FlexiWidgetConstructorParams,
	type FlexiWidgetDefaults,
	type FlexiWidgetDerivedConfiguration
} from './types.js';

export class FlexiWidgetController {
	/**
	 * Deletes this widget from its target and board. Fires the board's
	 * `onWidgetDelete` and `onLayoutChange`.
	 */
	delete(): void {
		throw new Error('delete() is only available on a mounted widget.');
	}

	/**
	 * Moves this widget through the controller API, with no user interaction:
	 * to a position in its own target, to another target (at a position, or
	 * wherever that target's grid puts it), or both. Runs the grid's placement
	 * rules but not `canDrop`, which is for user drops. Fires `onLayoutChange`.
	 * @returns Whether the widget could be placed. On failure it stays put.
	 */
	moveTo(options: { target?: FlexiTargetController; x?: number; y?: number }): boolean {
		void options;
		throw new Error('moveTo() is only available on a mounted widget.');
	}

	/**
	 * The target this widget is under. This is not defined if the widget has not yet been dropped in the board.
	 */
	#target$: Signal<FlexiTargetController | undefined> = signal(undefined);

	/**
	 * The DOM element bound to this widget.
	 */
	#ref$: Signal<HTMLElement | undefined> = signal(undefined);

	#providerWidgetDefaults$: ReadonlySignal<FlexiWidgetDefaults | undefined> = computed(
		() => this.target?.providerWidgetDefaults
	);
	#targetWidgetDefaults$: ReadonlySignal<FlexiWidgetDefaults | undefined> = computed(
		() => this.target?.config.widgetDefaults
	);
	#rawConfig$: Signal<FlexiWidgetConfiguration> = signal({} as FlexiWidgetConfiguration);

	/**
	 * The last config the adapter pushed in, used to tell an actual prop change
	 * apart from state that was set imperatively on this controller.
	 */
	#lastSyncedConfig: FlexiWidgetConfiguration | undefined = undefined;

	/**
	 * Whether this widget is a shadow dropzone widget.
	 */
	#isShadow$: Signal<boolean> = signal(false);

	/**
	 * Whether this widget is grabbed.
	 */
	#isGrabbed$: ReadonlySignal<boolean> = computed(() => this.currentAction?.action == 'grab');

	/**
	 * Whether this widget is being resized.
	 */
	#isResizing$: ReadonlySignal<boolean> = computed(() => this.currentAction?.action == 'resize');
	#dropRejected$: Signal<boolean> = signal(false);

	/**
	 * The reactive configuration of the widget. When these properties are changed, either due to a change in the widget's configuration,
	 * or a change in the target's, or the board's, they will be updated to reflect the new values.
	 */
	#config$: ReadonlySignal<FlexiWidgetDerivedConfiguration> = computed(() => ({
		component:
			this.#rawConfig$().component ??
			this.#targetWidgetDefaults$()?.component ??
			this.#providerWidgetDefaults$()?.component,
		componentProps:
			this.#rawConfig$().componentProps ??
			this.#targetWidgetDefaults$()?.componentProps ??
			this.#providerWidgetDefaults$()?.componentProps,
		snippet:
			this.#rawConfig$().snippet ??
			this.#targetWidgetDefaults$()?.snippet ??
			this.#providerWidgetDefaults$()?.snippet,
		resizability:
			this.#rawConfig$().resizability ??
			this.#targetWidgetDefaults$()?.resizability ??
			this.#providerWidgetDefaults$()?.resizability ??
			'none',
		draggability:
			this.#rawConfig$().draggability ??
			this.#targetWidgetDefaults$()?.draggability ??
			this.#providerWidgetDefaults$()?.draggability ??
			'full',
		// Derived from the resolved draggability, so `draggability: 'none'`
		// reads as not draggable.
		get draggable() {
			return this.draggability !== 'none';
		},
		className:
			this.#rawConfig$().className ??
			this.#targetWidgetDefaults$()?.className ??
			this.#providerWidgetDefaults$()?.className,
		metadata: this.#rawConfig$().metadata,
		transition:
			this.#rawConfig$().transition ??
			this.#targetWidgetDefaults$()?.transition ??
			this.#providerWidgetDefaults$()?.transition ??
			{}, // Default behaviour: don't animate
		grabTrigger:
			this.#rawConfig$().grabTrigger ??
			this.#targetWidgetDefaults$()?.grabTrigger ??
			this.#providerWidgetDefaults$()?.grabTrigger ??
			defaultTriggerConfig,
		resizeTrigger:
			this.#rawConfig$().resizeTrigger ??
			this.#targetWidgetDefaults$()?.resizeTrigger ??
			this.#providerWidgetDefaults$()?.resizeTrigger ??
			defaultTriggerConfig,
		minWidth:
			this.#rawConfig$().minWidth ??
			this.#targetWidgetDefaults$()?.minWidth ??
			this.#providerWidgetDefaults$()?.minWidth ??
			1,
		minHeight:
			this.#rawConfig$().minHeight ??
			this.#targetWidgetDefaults$()?.minHeight ??
			this.#providerWidgetDefaults$()?.minHeight ??
			1,
		maxWidth:
			this.#rawConfig$().maxWidth ??
			this.#targetWidgetDefaults$()?.maxWidth ??
			this.#providerWidgetDefaults$()?.maxWidth ??
			Infinity,
		maxHeight:
			this.#rawConfig$().maxHeight ??
			this.#targetWidgetDefaults$()?.maxHeight ??
			this.#providerWidgetDefaults$()?.maxHeight ??
			Infinity
	}));

	// Reactive state properties - single source of truth
	protected currentAction$: Signal<WidgetAction | null> = signal(null);
	protected width$: Signal<number> = signal(1);
	protected height$: Signal<number> = signal(1);
	protected x$: Signal<number> = signal(0);
	protected y$: Signal<number> = signal(0);
	protected isBeingDropped$: Signal<boolean> = signal(false);
	protected hasGrabbers$: Signal<boolean> = signal(false);
	protected hasResizers$: Signal<boolean> = signal(false);

	constructor(state: WidgetStateData, params: FlexiWidgetConstructorParams) {
		// Initialize reactive backing state
		this.currentAction$(state.currentAction);
		this.width$(state.width);
		this.height$(state.height);
		this.x$(state.x);
		this.y$(state.y);
		this.isBeingDropped$(state.isBeingDropped);
		this.hasGrabbers$(state.hasGrabbers);
		this.hasResizers$(state.hasResizers);

		this.#rawConfig$(params.config);

		if (params.target) {
			this.target = params.target as FlexiTargetController;
			this.isShadow = params.isShadow ?? false;
		}
	}

	// Getters and setters

	/**
	 * The target this widget is under. This is not defined if the widget has not yet been dropped in the board.
	 */
	get target() {
		return this.#target$();
	}

	set target(value: FlexiTargetController | undefined) {
		this.#target$(value);
	}

	/**
	 * The DOM element bound to this widget.
	 */
	get ref() {
		return this.#ref$();
	}

	set ref(value: HTMLElement | undefined) {
		this.#ref$(value);
	}

	/**
	 * Whether this widget is a shadow dropzone widget.
	 */
	get isShadow() {
		return this.#isShadow$();
	}

	set isShadow(value: boolean) {
		this.#isShadow$(value);
	}

	/**
	 * Whether this widget is grabbed.
	 */
	get isGrabbed() {
		return this.#isGrabbed$();
	}

	/**
	 * Whether this widget is being resized.
	 */
	get isResizing() {
		return this.#isResizing$();
	}

	/**
	 * Whether the widget is being grabbed or resized over a target that cannot accept it where it
	 * is: the drop would be rejected on release and the widget would return to where it came from.
	 */
	get dropRejected() {
		return this.#dropRejected$();
	}

	/** @internal */
	set dropRejected(value: boolean) {
		this.#dropRejected$(value);
	}

	/**
	 * Whether the widget is currently animating to a new position or size, e.g.
	 * mid drop flight. Useful for styling that should only apply at rest, such as
	 * hover effects that would otherwise fire as the widget lands under the pointer.
	 */
	get isInterpolating() {
		return false;
	}

	/**
	 * When the widget is being grabbed, this contains information that includes its position, size and offset.
	 * When this is null, the widget is not being grabbed.
	 */
	get currentAction() {
		return this.currentAction$();
	}

	set currentAction(value: WidgetAction | null) {
		this.currentAction$(value);
	}

	/**
	 * Updates the configuration backing this widget's reactive state.
	 * The adapter's prop seam: call whenever the component's config props change.
	 *
	 * Merges only the keys that actually changed since the last sync, rather than
	 * replacing wholesale. Two reasons: the raw config also holds registry
	 * defaults and any values set imperatively (`widget.draggability = ...`),
	 * which a wholesale replace would clobber; and staying inert when nothing
	 * changed is what stops an adapter effect from re-entering itself.
	 *
	 * Lives here (protected) because it needs the private config fields;
	 * exposed publicly via InternalFlexiWidgetController.updateConfig.
	 */
	protected syncConfig(config: FlexiWidgetConfiguration): void {
		const previous = this.#lastSyncedConfig;
		this.#lastSyncedConfig = { ...config };

		// The constructor already seeded the raw config from this same object.
		if (!previous) {
			return;
		}

		const changed = changedKeys(previous, config, 1);

		if (!changed.length) {
			return;
		}

		const raw = untracked(() => this.#rawConfig$()) as Record<string, unknown>;
		const source = config as Record<string, unknown>;

		for (const key of changed) {
			raw[key as string] = source[key as string];
		}

		// Mutated in place to preserve registry defaults, so subscribers need an
		// explicit nudge — the signal's identity hasn't changed.
		trigger(() => this.#rawConfig$());
	}

	/**
	 * Whether the widget can move at all: its `draggability` is not `'none'`.
	 * Read-only; set `draggability` to change it.
	 */
	get draggable() {
		return this.#config$().draggable;
	}

	/**
	 * The draggability of the widget.
	 */
	get draggability() {
		return this.#config$().draggability;
	}

	set draggability(value: WidgetDraggability) {
		this.#rawConfig$().draggability = value;
		trigger(() => this.#rawConfig$());
	}

	/**
	 * Whether the widget can be grabbed.
	 */
	get isGrabbable() {
		return this.#config$().draggability == 'full';
	}

	/**
	 * Whether the widget can be moved.
	 */
	get isMovable() {
		return this.#config$().draggability == 'movable' || this.#config$().draggability == 'full';
	}

	/**
	 * The resizability of the widget.
	 */
	get resizability() {
		return this.#config$().resizability;
	}

	set resizability(value: WidgetResizability) {
		this.#rawConfig$().resizability = value;
		trigger(() => this.#rawConfig$());
	}

	/**
	 * Whether the widget is resizable.
	 */
	get resizable() {
		return this.resizability !== 'none';
	}

	/**
	 * The width in units of the widget.
	 */
	get width() {
		return this.width$();
	}

	/**
	 * The height in units of the widget.
	 */
	get height() {
		return this.height$();
	}

	/**
	 * The component that is rendered by this widget.
	 */
	get component(): FlexiComponent | undefined {
		return this.#config$().component;
	}

	set component(value: FlexiComponent | undefined) {
		this.#rawConfig$().component = value;
		trigger(() => this.#rawConfig$());
	}

	/**
	 * The props applied to the component rendered, if it has one.
	 */
	get componentProps() {
		return this.#config$().componentProps;
	}

	set componentProps(value: Record<string, any> | undefined) {
		this.#rawConfig$().componentProps = value;
		trigger(() => this.#rawConfig$());
	}

	/**
	 * The snippet that is rendered by this widget.
	 */
	get snippet(): FlexiWidgetChildrenSnippet | undefined {
		return this.#config$().snippet;
	}

	set snippet(value: FlexiWidgetChildrenSnippet | undefined) {
		this.#rawConfig$().snippet = value;
		trigger(() => this.#rawConfig$());
	}

	/**
	 * The class name that is applied to this widget.
	 */
	get className() {
		return this.#config$().className;
	}

	set className(value: FlexiWidgetClasses | undefined) {
		this.#rawConfig$().className = value;
		trigger(() => this.#rawConfig$());
	}

	/**
	 * Gets the column (x-coordinate) of the widget. This value is readonly and is managed by the target.
	 */
	get x() {
		return this.x$();
	}

	/**
	 * Gets the row (y-coordinate) of the widget. This value is readonly and is managed by the target.
	 */
	get y() {
		return this.y$();
	}

	/**
	 * The metadata associated with this widget, if any.
	 */
	get metadata() {
		return this.#config$().metadata;
	}

	set metadata(value: Record<string, any> | undefined) {
		this.#rawConfig$().metadata = value;
		trigger(() => this.#rawConfig$());
	}

	/**
	 * Gets the configuration for how pointer events should trigger widget grabs (either on the widget directly
	 * or on a grabber).
	 */
	get grabTrigger() {
		return this.#config$().grabTrigger;
	}

	/**
	 * Gets the configuration for how pointer events should trigger widget resizing on a resizer.
	 */
	get resizeTrigger() {
		return this.#config$().resizeTrigger;
	}

	/**
	 * Gets the transition configuration for this widget.
	 */
	get transitionConfig() {
		return this.#config$().transition;
	}

	/**
	 * Whether the widget has any grabbers attached.
	 */
	get hasGrabbers(): boolean {
		return this.hasGrabbers$();
	}

	/**
	 * Whether the widget has any resizers attached
	 */
	get hasResizers(): boolean {
		return this.hasResizers$();
	}

	/**
	 * Whether the widget is currently being dropped after a drag operation.
	 */
	get isBeingDropped(): boolean {
		return this.isBeingDropped$();
	}

	set isBeingDropped(value: boolean) {
		this.isBeingDropped$(value);
	}

	/**
	 * The minimum width of the widget in units.
	 */
	get minWidth() {
		return this.#config$().minWidth;
	}

	/**
	 * The minimum height of the widget in units.
	 */
	get minHeight() {
		return this.#config$().minHeight;
	}

	/**
	 * The maximum width of the widget in units.
	 */
	get maxWidth() {
		return this.#config$().maxWidth;
	}

	/**
	 * The maximum height of the widget in units.
	 */
	get maxHeight() {
		return this.#config$().maxHeight;
	}

	/**
	 * The user-provided stable identifier for this widget, if any.
	 * This is used for persistence and layout import/export.
	 */
	get userProvidedId(): string | undefined {
		return undefined; // Overridden in InternalFlexiWidgetController
	}

	/**
	 * The type of this widget (registry key for looking up configuration).
	 */
	get type(): string | undefined {
		return undefined; // Overridden in InternalFlexiWidgetController
	}
}

export type WidgetStateData = {
	currentAction: WidgetAction | null;
	width: number;
	height: number;
	x: number;
	y: number;
	isBeingDropped: boolean;
	hasGrabbers: boolean;
	hasResizers: boolean;
};
