import { describe, expect, it } from 'vitest';
import { appleSpring } from './motion.svelte.js';

describe('appleSpring', () => {
	it('is critically damped at bounce 0 (ζ = 1)', () => {
		const { stiffness, damping } = appleSpring({ duration: 0.5 });
		expect(damping! / (2 * Math.sqrt(stiffness!))).toBeCloseTo(1);
	});

	it('reduces damping as bounce rises and clamps bounce to [0, 1]', () => {
		const soft = appleSpring({ duration: 0.5, bounce: 0.5 });
		const hard = appleSpring({ duration: 0.5, bounce: 0 });
		expect(soft.damping).toBeLessThan(hard.damping!);
		expect(appleSpring({ duration: 0.5, bounce: 2 }).damping).toBe(0);
	});

	it('shorter durations are stiffer, and stay within Svelte\'s [0, 1] ranges for sane inputs', () => {
		const fast = appleSpring({ duration: 0.25 });
		const slow = appleSpring({ duration: 1 });
		expect(fast.stiffness).toBeGreaterThan(slow.stiffness!);
		for (const o of [fast, slow]) {
			expect(o.stiffness).toBeGreaterThan(0);
			expect(o.stiffness).toBeLessThanOrEqual(1);
			expect(o.damping).toBeLessThanOrEqual(1);
		}
	});
});
