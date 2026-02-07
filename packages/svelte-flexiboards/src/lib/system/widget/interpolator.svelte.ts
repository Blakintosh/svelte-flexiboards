import type { InternalFlexiBoardController } from '../board/controller.svelte.js';
import type { Position } from '../types.js';
import type { FlexiWidgetController } from './base.svelte.js';
import type { FlexiWidgetTransitionConfiguration } from './types.js';
import { getPlaceholderMinDimensionLocks, type InterpolationSize } from './interpolation-utils.js';

export class WidgetMoveInterpolator {
	active: boolean = $state(false);

	#timeout?: ReturnType<typeof setTimeout>;

	#provider: InternalFlexiBoardController = $state() as InternalFlexiBoardController;

	#containerRef?: HTMLElement | null = $derived(this.#provider?.ref);
	ref?: HTMLElement;

	#observer?: MutationObserver;

	#placeholderPosition: PlaceholderPosition = $state({
		x: 0,
		y: 0,
		width: 1,
		height: 1,
		heightPx: 0,
		widthPx: 0,
		lockMinWidth: true,
		lockMinHeight: true
	});

	#interpolatedWidgetPosition: InterpolationPosition = $state({
		left: 0,
		top: 0,
		width: 1,
		height: 1
	});

	#inInitialFrame: boolean = $state(false);
	#animation: WidgetMovementAnimation = $state('move');

	#widget: FlexiWidgetController = $state() as FlexiWidgetController;
	#transitionConfig: FlexiWidgetTransitionConfiguration = $derived(this.#widget?.transitionConfig);

	widgetStyle: string = $derived.by(() => {
		const transitionConfig = this.#getTransitionConfigForAnimation(this.#animation);
		if (this.#inInitialFrame || !transitionConfig?.duration || !transitionConfig?.easing) {
			return `position: absolute; top: ${this.#interpolatedWidgetPosition.top}px; left: ${this.#interpolatedWidgetPosition.left}px; width: ${this.#interpolatedWidgetPosition.width}px; height: ${this.#interpolatedWidgetPosition.height}px;`;
		}

		return `transition: all ${transitionConfig.duration}ms ${transitionConfig.easing}; position: absolute; top: ${this.#interpolatedWidgetPosition.top}px; left: ${this.#interpolatedWidgetPosition.left}px; width: ${this.#interpolatedWidgetPosition.width}px; height: ${this.#interpolatedWidgetPosition.height}px;`;
	});

	placeholderStyle: string = $derived.by(() => {
		const minHeight = this.#placeholderPosition.lockMinHeight
			? ` min-height: ${this.#placeholderPosition.heightPx}px;`
			: '';
		const minWidth = this.#placeholderPosition.lockMinWidth
			? ` min-width: ${this.#placeholderPosition.widthPx}px;`
			: '';
		return `grid-column: ${this.#placeholderPosition.x + 1} / span ${this.#placeholderPosition.width}; grid-row: ${this.#placeholderPosition.y + 1} / span ${this.#placeholderPosition.height};${minHeight}${minWidth} visibility: hidden;`;
	});

	constructor(provider: InternalFlexiBoardController, widget: FlexiWidgetController) {
		this.#provider = provider;
		this.#widget = widget;
		this.onPlaceholderMount = this.onPlaceholderMount.bind(this);
		this.onPlaceholderUnmount = this.onPlaceholderUnmount.bind(this);
	}

	#notifyStart() {
		this.#provider?.notifyInterpolationStarted();
	}

	#notifyEnd() {
		this.#provider?.notifyInterpolationEnded();
	}

	interpolateMove(
		newDimensions: Dimensions,
		oldPosition: InterpolationPosition,
		animation: WidgetMovementAnimation = 'move',
		previousDimensions?: InterpolationSize
	) {
		const containerRect = this.#containerRef?.getBoundingClientRect();
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

		const isInterruption = this.active;
		clearTimeout(this.#timeout);

		if (isInterruption) {
			// INTERRUPTION PATH - only update target, keep transition flowing
			// Don't change #animation to preserve CSS transition property
			// Don't reset #interpolatedWidgetPosition

			this.#placeholderPosition = {
				x: newDimensions.x,
				y: newDimensions.y,
				width: newDimensions.width,
				height: newDimensions.height,
				heightPx: this.#interpolatedWidgetPosition.height,
				widthPx: this.#interpolatedWidgetPosition.width,
				lockMinWidth: minDimensionLocks.lockMinWidth,
				lockMinHeight: minDimensionLocks.lockMinHeight
			};
		} else {
			// INITIAL MOVE PATH - set up starting position, then animate
			this.#inInitialFrame = true; // Disable CSS transition for initial position
			this.active = true;
			this.#animation = animation;
			this.#notifyStart();

			this.#placeholderPosition = {
				x: newDimensions.x,
				y: newDimensions.y,
				width: newDimensions.width,
				height: newDimensions.height,
				heightPx: oldPosition.height,
				widthPx: oldPosition.width,
				lockMinWidth: minDimensionLocks.lockMinWidth,
				lockMinHeight: minDimensionLocks.lockMinHeight
			};

			this.#interpolatedWidgetPosition.top =
				oldPosition.top - containerRect.top + (this.#containerRef?.scrollTop ?? 0);
			this.#interpolatedWidgetPosition.left =
				oldPosition.left - containerRect.left + (this.#containerRef?.scrollLeft ?? 0);
			this.#interpolatedWidgetPosition.width = oldPosition.width;
			this.#interpolatedWidgetPosition.height = oldPosition.height;
		}

		// Reset timeout for both paths
		requestAnimationFrame(() => {
			this.#timeout = setTimeout(() => {
				this.active = false;
				this.#animation = 'move';
				this.#notifyEnd();
			}, transitionConfig.duration);
		});
	}

	onPlaceholderMove(rect: DOMRect) {
		requestAnimationFrame(() => {
			this.#inInitialFrame = false;

			// Now finalise the position.
			const containerRect = this.#containerRef?.getBoundingClientRect();
			if (!containerRect) {
				return;
			}

			this.#interpolatedWidgetPosition.top =
				rect.top - containerRect.top + (this.#containerRef?.scrollTop ?? 0);
			this.#interpolatedWidgetPosition.left =
				rect.left - containerRect.left + (this.#containerRef?.scrollLeft ?? 0);
			this.#interpolatedWidgetPosition.width = rect.width;
			this.#interpolatedWidgetPosition.height = rect.height;
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
		return this.#transitionConfig[animation];
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
