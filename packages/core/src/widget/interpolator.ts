import type { InternalFlexiBoardController } from '../board/controller.js';
import type { Position, ReadonlySignal, Signal } from '../types.js';
import type { FlexiWidgetController } from './base.js';
import type { FlexiWidgetTransitionConfiguration } from './types.js';
import { getPlaceholderMinDimensionLocks, type InterpolationSize } from './interpolation-utils.js';
import { computed, signal } from '../reactivity.js';
import {
	resolveAnimationAdapter,
	type AnimationBox,
	type AnimationHandle,
	type WidgetMovementAnimation
} from './animation.js';

export class WidgetMoveInterpolator {
	active$: Signal<boolean> = signal(false);

	/** The adapter handle driving the current animation, if any. */
	#handle$: Signal<AnimationHandle<AnimationBox> | undefined> = signal(undefined);

	#provider$: Signal<InternalFlexiBoardController> = signal({} as InternalFlexiBoardController);

	#containerRef$: ReadonlySignal<HTMLElement | undefined> = computed(() => this.#provider$()?.ref);
	ref?: HTMLElement;

	#observer?: MutationObserver;

	#placeholderPosition$: Signal<PlaceholderPosition> = signal({
		x: 0,
		y: 0,
		width: 1,
		height: 1,
		heightPx: 0,
		widthPx: 0,
		lockMinWidth: true,
		lockMinHeight: true
	});

	#interpolatedWidgetPosition$: Signal<AnimationBox> = signal({
		left: 0,
		top: 0,
		width: 1,
		height: 1
	});

	#animation$: Signal<WidgetMovementAnimation> = signal('move');

	#widget$: Signal<FlexiWidgetController> = signal({} as FlexiWidgetController);
	#transitionConfig$: ReadonlySignal<FlexiWidgetTransitionConfiguration> = computed(
		() => this.#widget$()?.transitionConfig
	);

	widgetStyle$: ReadonlySignal<string> = computed(() => {
		const extra = this.#handle$()?.extraStyle?.() ?? '';
		const { top, left, width, height } = this.#interpolatedWidgetPosition$();

		return `${extra ? extra + ' ' : ''}position: absolute; top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px;`;
	});

	placeholderStyle$: ReadonlySignal<string> = computed(() => {
		const placeholderPosition = this.#placeholderPosition$();

		const minHeight = placeholderPosition.lockMinHeight
			? ` min-height: ${placeholderPosition.heightPx}px;`
			: '';
		const minWidth = placeholderPosition.lockMinWidth
			? ` min-width: ${placeholderPosition.widthPx}px;`
			: '';
		return `grid-column: ${placeholderPosition.x + 1} / span ${placeholderPosition.width}; grid-row: ${placeholderPosition.y + 1} / span ${placeholderPosition.height};${minHeight}${minWidth} visibility: hidden;`;
	});

	constructor(provider: InternalFlexiBoardController, widget: FlexiWidgetController) {
		this.#provider$(provider);
		this.#widget$(widget);
		this.onPlaceholderMount = this.onPlaceholderMount.bind(this);
		this.onPlaceholderUnmount = this.onPlaceholderUnmount.bind(this);
	}

	#notifyStart() {
		this.#provider$()?.notifyInterpolationStarted();
	}

	#notifyEnd() {
		this.#provider$()?.notifyInterpolationEnded();
	}

	interpolateMove(
		newDimensions: Dimensions,
		oldPosition: AnimationBox,
		animation: WidgetMovementAnimation = 'move',
		previousDimensions?: InterpolationSize
	) {
		const containerRect = this.#containerRef$()?.getBoundingClientRect();
		if (!containerRect) {
			return;
		}

		// If a config hasn't been set for this animation, then don't animate.
		const adapter = resolveAnimationAdapter(this.#getTransitionConfigForAnimation(animation));
		if (!adapter) {
			return;
		}

		const minDimensionLocks = getPlaceholderMinDimensionLocks(
			animation,
			{
				width: newDimensions.width,
				height: newDimensions.height
			},
			previousDimensions
		);

		const isInterruption = this.active$();
		const interpolatedPosition = this.#interpolatedWidgetPosition$();

		if (isInterruption) {
			// INTERRUPTION PATH - keep the running handle; the placeholder's style change will
			// retarget it via onPlaceholderMove.
			this.#placeholderPosition$({
				x: newDimensions.x,
				y: newDimensions.y,
				width: newDimensions.width,
				height: newDimensions.height,
				heightPx: interpolatedPosition.height,
				widthPx: interpolatedPosition.width,
				lockMinWidth: minDimensionLocks.lockMinWidth,
				lockMinHeight: minDimensionLocks.lockMinHeight
			});
			return;
		}

		// INITIAL MOVE PATH - start a new animation from the widget's current box.
		this.active$(true);
		this.#animation$(animation);
		this.#notifyStart();

		this.#placeholderPosition$({
			x: newDimensions.x,
			y: newDimensions.y,
			width: newDimensions.width,
			height: newDimensions.height,
			heightPx: oldPosition.height,
			widthPx: oldPosition.width,
			lockMinWidth: minDimensionLocks.lockMinWidth,
			lockMinHeight: minDimensionLocks.lockMinHeight
		});

		const from: AnimationBox = {
			top: oldPosition.top - containerRect.top + (this.#containerRef$()?.scrollTop ?? 0),
			left: oldPosition.left - containerRect.left + (this.#containerRef$()?.scrollLeft ?? 0),
			width: oldPosition.width,
			height: oldPosition.height
		};

		const handle = adapter.start(from, {
			kind: animation,
			emit: (current) => this.#interpolatedWidgetPosition$({ ...current }),
			onSettle: () => {
				// Ignore settles from a handle that has since been replaced.
				if (this.#handle$() !== handle) {
					return;
				}
				this.#handle$(undefined);
				this.active$(false);
				this.#animation$('move');
				this.#notifyEnd();
			}
		});
		this.#handle$(handle);
	}

	/** Cancels any running animation. */
	stop() {
		this.#handle$()?.stop();
		this.#handle$(undefined);
		this.active$(false);
		this.#animation$('move');
	}

	onPlaceholderMove(rect: DOMRect) {
		// Wait a frame so the starting box has painted before retargeting.
		requestAnimationFrame(() => {
			const containerRect = this.#containerRef$()?.getBoundingClientRect();
			const handle = this.#handle$();
			if (!containerRect || !handle) {
				return;
			}

			handle.setTarget({
				top: rect.top - containerRect.top + (this.#containerRef$()?.scrollTop ?? 0),
				left: rect.left - containerRect.left + (this.#containerRef$()?.scrollLeft ?? 0),
				width: rect.width,
				height: rect.height
			});
		});
	}

	onPlaceholderMount(ref: HTMLElement) {
		this.ref = ref;

		// Now that we're mounted, start moving our widget.
		this.onPlaceholderMove(this.ref.getBoundingClientRect());

		// However, if the widget moves again before timeout, we need to track and update the position.
		this.#observer = new MutationObserver((mutations) => {
			if (!this.ref) {
				return;
			}

			for (const mutation of mutations) {
				if (mutation.type == 'attributes' && mutation.attributeName == 'style') {
					this.onPlaceholderMove(this.ref.getBoundingClientRect());
				}
			}
		});

		this.#observer.observe(this.ref, { attributes: true });

		return this.onPlaceholderUnmount;
	}

	onPlaceholderUnmount() {
		this.ref = undefined;

		this.#observer?.disconnect();
		this.#observer = undefined;
	}

	#getTransitionConfigForAnimation(animation: WidgetMovementAnimation) {
		return this.#transitionConfig$()[animation];
	}
}

type Dimensions = Position & {
	width: number;
	height: number;
};

type PlaceholderPosition = {
	x: number;
	y: number;
	// The width and height of the placeholder in units.
	width: number;
	height: number;
	// The width and height of the placeholder in pixels.
	heightPx: number;
	widthPx: number;
	// Whether min dimensions should be applied to the placeholder.
	lockMinWidth: boolean;
	lockMinHeight: boolean;
};
