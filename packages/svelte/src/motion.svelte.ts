import { Spring, Tween } from 'svelte/motion';
import type { AnimationAdapter, AnimationBox } from '@flexiboards/core';

type SvelteSpringOptions = NonNullable<ConstructorParameters<typeof Spring<AnimationBox>>[1]>;

/**
 * Apple-style (SwiftUI `.spring(duration:bounce:)`) parameters.
 * - `duration`: perceptual settle time in seconds (≈ the period of the spring).
 * - `bounce`: 0 = critically damped, 1 = no damping. Defaults to 0.
 */
export type AppleSpringOptions = { duration: number; bounce?: number };

export type SpringOptions = SvelteSpringOptions | AppleSpringOptions;

const FRAME_MS = 1000 / 60;

/**
 * Translates Apple-style parameters into Svelte's frame-normalised `stiffness`/`damping`.
 *
 * Svelte's integrator is `a = -stiffness * x - damping * v` per 60fps frame, i.e. a unit-mass
 * oscillator with ω0 = √stiffness rad/frame and ζ = damping / (2√stiffness). Apple's
 * `duration` is the response period T = 2π/ω0 and `bounce` = 1 - ζ. Approximate, since
 * Svelte integrates discretely, but perceptually close for typical values.
 *
 * Svelte clamps `damping` to [0, 1], so very short, low-bounce springs (roughly
 * `duration < 0.21s` at `bounce: 0`) will be slightly under-damped compared to Apple's.
 */
export function appleSpring({ duration, bounce = 0 }: AppleSpringOptions): SvelteSpringOptions {
	const omega = (2 * Math.PI) / ((duration * 1000) / FRAME_MS); // rad per frame
	const stiffness = omega * omega;
	const zeta = 1 - Math.min(Math.max(bounce, 0), 1);
	const damping = 2 * zeta * Math.sqrt(stiffness);

	return { stiffness, damping, precision: 0.01 };
}

function toSvelteSpringOptions(options?: SpringOptions): SvelteSpringOptions | undefined {
	return options && 'duration' in options ? appleSpring(options) : options;
}
type TweenOptions = ConstructorParameters<typeof Tween<AnimationBox>>[1];

/**
 * Bridges a Svelte motion value (Spring or Tween) into a Flexiboards animation handle:
 * an effect root forwards `current` into core on every frame, and `set()`'s promise
 * signals settling.
 */
function motionAdapter(
	create: (from: AnimationBox) => Spring<AnimationBox> | Tween<AnimationBox>
): AnimationAdapter<AnimationBox> {
	return {
		start(from, { emit, onSettle }) {
			const motion = create(from);
			let stopped = false;
			let generation = 0;

			const destroy = $effect.root(() => {
				$effect(() => {
					emit(motion.current);
				});
			});

			return {
				setTarget(to) {
					const mine = ++generation;
					motion.set(to).then(() => {
						// Only the latest target's settle counts; an interrupted set() also resolves.
						if (!stopped && mine === generation) {
							onSettle();
						}
					}, () => {
						// Svelte rejects the previous set()'s promise with 'Aborted' on retarget; that's expected.
					});
				},
				stop() {
					stopped = true;
					destroy();
				}
			};
		}
	};
}

/**
 * Animates widget movement with a Svelte {@link Spring}.
 * Accepts either Svelte's `{ stiffness, damping }` or Apple-style `{ duration, bounce }`.
 * @example transition: { move: spring({ duration: 0.4, bounce: 0.2 }) }
 */
export function spring(options?: SpringOptions): AnimationAdapter<AnimationBox> {
	const svelteOptions = toSvelteSpringOptions(options);
	return motionAdapter((from) => new Spring(from, svelteOptions));
}

/**
 * Animates widget movement with a Svelte {@link Tween}.
 * @example transition: { drop: tween({ duration: 200, easing: cubicOut }) }
 */
export function tween(options?: TweenOptions): AnimationAdapter<AnimationBox> {
	return motionAdapter((from) => new Tween(from, options));
}
