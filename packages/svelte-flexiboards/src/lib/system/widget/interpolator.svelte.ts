import type { InternalFlexiBoardController } from '../provider.svelte.js';
import type { Position } from '../types.js';
import type { FlexiWidgetController } from './base.svelte.js';
import type { FlexiWidgetTransitionConfiguration } from './types.js';

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
		widthPx: 0
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
		return `grid-column: ${this.#placeholderPosition.x + 1} / span ${this.#placeholderPosition.width}; grid-row: ${this.#placeholderPosition.y + 1} / span ${this.#placeholderPosition.height}; width: ${this.#placeholderPosition.widthPx}px; height: ${this.#placeholderPosition.heightPx}px; visibility: hidden;`;
	});

	constructor(provider: InternalFlexiBoardController, widget: FlexiWidgetController) {
		this.#provider = provider;
		this.#widget = widget;
		this.onPlaceholderMount = this.onPlaceholderMount.bind(this);
		this.onPlaceholderUnmount = this.onPlaceholderUnmount.bind(this);
	}

	interpolateMove(
		newDimensions: Dimensions,
		oldPosition: InterpolationPosition,
		animation: WidgetMovementAnimation = 'move'
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

		if (this.active) {
			clearTimeout(this.#timeout);
		}

		this.active = true;

		this.#placeholderPosition = {
			x: newDimensions.x,
			y: newDimensions.y,
			width: newDimensions.width,
			height: newDimensions.height,
			heightPx: oldPosition.height,
			widthPx: oldPosition.width
		};

		this.#interpolatedWidgetPosition.top = oldPosition.top - containerRect.top;
		this.#interpolatedWidgetPosition.left = oldPosition.left - containerRect.left;
		this.#interpolatedWidgetPosition.width = oldPosition.width;
		this.#interpolatedWidgetPosition.height = oldPosition.height;

		requestAnimationFrame(() => {
			this.#timeout = setTimeout(() => {
				this.active = false;
				this.#animation = 'move';
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

			this.#interpolatedWidgetPosition.top = rect.top - containerRect.top;
			this.#interpolatedWidgetPosition.left = rect.left - containerRect.left;
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

export type WidgetMovementAnimation = 'move' | 'drop';

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
};
