import { signal } from '../reactivity.js';
import type { Signal } from '../types.js';

/**
 * The kinds of widget movement that can be animated.
 */
export type WidgetMovementAnimation = 'move' | 'drop' | 'resize';

/**
 * A box, in pixels relative to the board container, that an animation moves a widget through.
 */
export type AnimationBox = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type AnimationStartContext<T> = {
	/** Which kind of movement this animation is for. */
	kind: WidgetMovementAnimation;
	/**
	 * Pushes the current animated value into Flexiboards. The adapter owns the timing:
	 * a CSS adapter emits the target once and lets the browser interpolate, whereas a
	 * spring adapter emits every frame.
	 */
	emit: (current: T) => void;
	/** Must be called exactly once, when the animation has come to rest. */
	onSettle: () => void;
};

export interface AnimationHandle<T> {
	/**
	 * Sets (or retargets) the destination of the animation. Called once the destination
	 * has been measured, and again whenever it changes mid-flight.
	 */
	setTarget(to: T): void;
	/**
	 * Extra inline CSS to apply to the animating element (e.g. a `transition` declaration).
	 * Read inside a reactive computation, so it may read core signals.
	 */
	extraStyle?(): string;
	/** Cancels the animation. `onSettle` will not be called after this. */
	stop(): void;
}

/**
 * Drives how a widget moves from one box to another. Framework packages provide
 * adapters backed by their own motion primitives (e.g. Svelte's Spring); core ships
 * {@link cssTransition}.
 */
export interface AnimationAdapter<T = AnimationBox> {
	start(from: T, context: AnimationStartContext<T>): AnimationHandle<T>;
}

export type CssTransitionOptions = {
	duration: number;
	easing: string;
};

/**
 * Animates using a CSS `transition`. The starting box is painted for one frame without a
 * transition, then the target is applied with `transition: all` so the browser interpolates.
 */
export function cssTransition(options: CssTransitionOptions): AnimationAdapter<AnimationBox> {
	const { duration, easing } = options;

	return {
		start(from, { emit, onSettle }) {
			// Starts false so the initial position is applied without a transition.
			const transitioning$: Signal<boolean> = signal(false);
			let timeout: ReturnType<typeof setTimeout> | undefined;

			emit(from);

			return {
				setTarget(to) {
					transitioning$(true);
					emit(to);

					clearTimeout(timeout);
					timeout = setTimeout(onSettle, duration);
				},
				extraStyle() {
					return transitioning$() ? `transition: all ${duration}ms ${easing};` : '';
				},
				stop() {
					clearTimeout(timeout);
				}
			};
		}
	};
}

/**
 * Legacy transition shape: a plain `{ duration, easing }` object, treated as {@link cssTransition}.
 */
export type CssTransitionConfiguration = Partial<CssTransitionOptions>;

/**
 * Normalises a transition configuration entry into an adapter. Returns undefined when the
 * entry is missing or cannot animate (no duration/easing), meaning "don't animate".
 */
export function resolveAnimationAdapter(
	config: CssTransitionConfiguration | AnimationAdapter<AnimationBox> | undefined
): AnimationAdapter<AnimationBox> | undefined {
	if (!config) {
		return undefined;
	}

	if ('start' in config) {
		return config;
	}

	if (!config.duration || !config.easing) {
		return undefined;
	}

	return cssTransition({ duration: config.duration, easing: config.easing });
}

export type SpringOptions = {
	/** Perceptual settle time in seconds (the spring's response period). */
	duration: number;
	/** 0 = critically damped (no overshoot), up to 1 = undamped. Defaults to 0. */
	bounce?: number;
	/** Position (px) and velocity (px/s) below which the spring is considered settled. */
	precision?: number;
};

/**
 * Animates with a damped spring driven by requestAnimationFrame, using Apple-style
 * parameters (SwiftUI `.spring(duration:bounce:)`). Dependency-free, so it behaves
 * identically in every framework adapter. Retargeting mid-flight preserves velocity.
 */
export function spring(options: SpringOptions): AnimationAdapter<AnimationBox> {
	const { duration, bounce = 0, precision = 0.05 } = options;
	const omega = (2 * Math.PI) / duration; // rad/s
	const zeta = 1 - Math.min(Math.max(bounce, 0), 1);
	const keys: (keyof AnimationBox)[] = ['left', 'top', 'width', 'height'];

	return {
		start(from, { emit, onSettle }) {
			const current = { ...from };
			const velocity: AnimationBox = { left: 0, top: 0, width: 0, height: 0 };
			let target: AnimationBox | undefined;
			let frame: number | undefined;
			let lastTime: number | undefined;

			emit(from);

			const tick = (now: number) => {
				frame = undefined;
				if (!target) {
					return;
				}

				// Clamp so a backgrounded tab doesn't explode the integrator on resume.
				const dt = Math.min((now - (lastTime ?? now)) / 1000, 1 / 30);
				lastTime = now;

				let settled = true;
				for (const key of keys) {
					const delta = target[key] - current[key];
					// Semi-implicit Euler on x'' = ω²·Δ − 2ζω·x'
					const acceleration = omega * omega * delta - 2 * zeta * omega * velocity[key];
					velocity[key] += acceleration * dt;
					current[key] += velocity[key] * dt;

					if (Math.abs(delta) > precision || Math.abs(velocity[key]) > precision) {
						settled = false;
					}
				}

				if (settled) {
					Object.assign(current, target);
					for (const key of keys) {
						velocity[key] = 0;
					}
					emit({ ...current });
					onSettle();
					return;
				}

				emit({ ...current });
				frame = requestAnimationFrame(tick);
			};

			return {
				setTarget(to) {
					target = { ...to };
					if (frame === undefined) {
						lastTime = undefined;
						frame = requestAnimationFrame(tick);
					}
				},
				stop() {
					if (frame !== undefined) {
						cancelAnimationFrame(frame);
						frame = undefined;
					}
					target = undefined;
				}
			};
		}
	};
}
