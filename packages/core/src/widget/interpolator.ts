import type { InternalFlexiBoardController } from '../board/controller.js';
import type { InternalFlexiWidgetController } from './controller.js';
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
		previousDimensions?: InterpolationSize,
		/** Pixel size for the placeholder's min-dimension locks; defaults to `oldPosition`'s. */
		lockSize?: InterpolationSize
	) {
		if (!this.#containingBlock()) {
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

		// A drop or resize ends an interaction, during which the widget was rendered elsewhere
		// (portal clone / resize preview): the running animation's position is stale, so it is
		// restarted from `oldPosition` rather than retargeted.
		const restart = isInterruption && animation !== 'move';

		if (isInterruption && !restart) {
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
		if (restart) {
			// Still active from the board's point of view: swap the handle without re-notifying.
			this.#handle$()?.stop();
			this.#handle$(undefined);
		} else {
			this.active$(true);
			this.#notifyStart();
		}
		this.#animation$(animation);

		this.#placeholderPosition$({
			x: newDimensions.x,
			y: newDimensions.y,
			width: newDimensions.width,
			height: newDimensions.height,
			heightPx: lockSize?.height ?? oldPosition.height,
			widthPx: lockSize?.width ?? oldPosition.width,
			lockMinWidth: minDimensionLocks.lockMinWidth,
			lockMinHeight: minDimensionLocks.lockMinHeight
		});

		const from = this.#toBox(oldPosition);
		if (!from) {
			return;
		}

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

		// On a restart the placeholder is already mounted, and its style may not change (e.g. a
		// cancel back to the same cell), so the new handle is given its target explicitly.
		if (restart && this.ref) {
			this.onPlaceholderMove(this.ref.getBoundingClientRect());
		}
	}

	/**
	 * The element an absolutely-positioned widget resolves against. Usually the board, but
	 * a positioned ancestor between the board and the grid (e.g. a scrolling wrapper) takes
	 * over, so the placeholder's offsetParent is the source of truth when available.
	 */
	#containingBlock(): HTMLElement | undefined {
		// The grid is the one element guaranteed to be mounted: the widget's own element may not
		// exist yet (a drop creates it) and the placeholder only mounts once the animation starts.
		const grid = (this.#widget$() as InternalFlexiWidgetController | undefined)?.internalTarget?.grid
			?.ref;
		if (grid) {
			const positioned =
				typeof getComputedStyle === 'function' && getComputedStyle(grid).position !== 'static';
			const block = positioned ? grid : grid.offsetParent;
			if (block && 'clientTop' in block) {
				return block as HTMLElement;
			}
		}
		return this.#containerRef$();
	}

	/** Converts a viewport rect into a box in the containing block's coordinate space. */
	#toBox(rect: { top: number; left: number; width: number; height: number }): AnimationBox | undefined {
		const block = this.#containingBlock();
		if (!block) {
			return undefined;
		}

		const blockRect = block.getBoundingClientRect();
		return {
			top: rect.top - blockRect.top - block.clientTop + block.scrollTop,
			left: rect.left - blockRect.left - block.clientLeft + block.scrollLeft,
			width: rect.width,
			height: rect.height
		};
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
			const handle = this.#handle$();
			const to = this.#toBox(rect);
			if (!handle || !to) {
				return;
			}

			handle.setTarget(to);
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
