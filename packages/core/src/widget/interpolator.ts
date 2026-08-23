import type { InternalFlexiBoardController } from '../board/controller.js';
import type { Position, ReadonlySignal, Signal } from '../types.js';
import type { FlexiWidgetController } from './base.js';
import type { FlexiWidgetTransitionConfiguration } from './types.js';
import { getPlaceholderMinDimensionLocks, type InterpolationSize } from './interpolation-utils.js';
import { computed, signal, trigger } from '../reactivity.js';

export class WidgetMoveInterpolator {
	active$: Signal<boolean> = signal(false);

	#timeout?: ReturnType<typeof setTimeout>;

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

	#interpolatedWidgetPosition$: Signal<InterpolationPosition> = signal({
		left: 0,
		top: 0,
		width: 1,
		height: 1
	});

	#inInitialFrame$: Signal<boolean> = signal(false);
	#animation$: Signal<WidgetMovementAnimation> = signal('move');

	#widget$: Signal<FlexiWidgetController> = signal({} as FlexiWidgetController);
	#transitionConfig$: ReadonlySignal<FlexiWidgetTransitionConfiguration> = computed(
		() => this.#widget$()?.transitionConfig
	);

	widgetStyle$: ReadonlySignal<string> = computed(() => {
		const transitionConfig = this.#getTransitionConfigForAnimation(this.#animation$());
		const interpolatedPosition = this.#interpolatedWidgetPosition$();

		if (this.#inInitialFrame$() || !transitionConfig?.duration || !transitionConfig?.easing) {
			return `position: absolute; top: ${interpolatedPosition.top}px; left: ${interpolatedPosition.left}px; width: ${interpolatedPosition.width}px; height: ${interpolatedPosition.height}px;`;
		}

		return `transition: all ${transitionConfig.duration}ms ${transitionConfig.easing}; position: absolute; top: ${interpolatedPosition.top}px; left: ${interpolatedPosition.left}px; width: ${interpolatedPosition.width}px; height: ${interpolatedPosition.height}px;`;
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
		oldPosition: InterpolationPosition,
		animation: WidgetMovementAnimation = 'move',
		previousDimensions?: InterpolationSize
	) {
		const containerRect = this.#containerRef$()?.getBoundingClientRect();
		if (!containerRect) {
			return;
		}

		// If a config hasn't been set for this animation, then don't animate.
		const transitionConfig = this.#getTransitionConfigForAnimation(animation);
		if (!transitionConfig || !transitionConfig.duration || !transitionConfig.easing) {
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
		clearTimeout(this.#timeout);

		const interpolatedPosition = this.#interpolatedWidgetPosition$();

		if (isInterruption) {
			// INTERRUPTION PATH - only update target, keep transition flowing
			// Don't change #animation to preserve CSS transition property
			// Don't reset #interpolatedWidgetPosition

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
		} else {
			// INITIAL MOVE PATH - set up starting position, then animate
			this.#inInitialFrame$(true); // Disable CSS transition for initial position
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

			interpolatedPosition.top =
				oldPosition.top - containerRect.top + (this.#containerRef$()?.scrollTop ?? 0);
			interpolatedPosition.left =
				oldPosition.left - containerRect.left + (this.#containerRef$()?.scrollLeft ?? 0);
			interpolatedPosition.width = oldPosition.width;
			interpolatedPosition.height = oldPosition.height;

			// updated in place, manually trigger reactivity.
			trigger(() => this.#interpolatedWidgetPosition$());
		}

		// Reset timeout for both paths
		requestAnimationFrame(() => {
			this.#timeout = setTimeout(() => {
				this.active$(false);
				this.#animation$('move');
				this.#notifyEnd();
			}, transitionConfig.duration);
		});
	}

	onPlaceholderMove(rect: DOMRect) {
		requestAnimationFrame(() => {
			this.#inInitialFrame$(false);

			// Now finalise the position.
			const containerRect = this.#containerRef$()?.getBoundingClientRect();
			if (!containerRect) {
				return;
			}

			const interpolatedPosition = this.#interpolatedWidgetPosition$();
			interpolatedPosition.top =
				rect.top - containerRect.top + (this.#containerRef$()?.scrollTop ?? 0);
			interpolatedPosition.left =
				rect.left - containerRect.left + (this.#containerRef$()?.scrollLeft ?? 0);
			interpolatedPosition.width = rect.width;
			interpolatedPosition.height = rect.height;

			// updated in place, manually trigger reactivity.
			trigger(() => this.#interpolatedWidgetPosition$());
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

export type WidgetMovementAnimation = 'move' | 'drop' | 'resize';

type Dimensions = Position & {
	width: number;
	height: number;
};

type InterpolationPosition = {
	left: number;
	top: number;
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
