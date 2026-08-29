import { describe, expect, it, vi } from 'vitest';
import { cssTransition, resolveAnimationAdapter, spring, type AnimationBox } from './animation.js';
import { springTransitionConfig } from './index.js';

const box = (n: number): AnimationBox => ({ left: n, top: n, width: n, height: n });

describe('cssTransition', () => {
	it('emits the start box without a transition, then the target with one, then settles', () => {
		vi.useFakeTimers();
		const emit = vi.fn();
		const onSettle = vi.fn();

		const handle = cssTransition({ duration: 150, easing: 'ease-out' }).start(box(0), {
			kind: 'move',
			emit,
			onSettle
		});

		expect(emit).toHaveBeenLastCalledWith(box(0));
		expect(handle.extraStyle?.()).toBe('');

		handle.setTarget(box(10));
		expect(emit).toHaveBeenLastCalledWith(box(10));
		expect(handle.extraStyle?.()).toBe('transition: all 150ms ease-out;');

		vi.advanceTimersByTime(149);
		expect(onSettle).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(onSettle).toHaveBeenCalledOnce();
		vi.useRealTimers();
	});

	it('restarts the settle timer on retarget and cancels on stop', () => {
		vi.useFakeTimers();
		const onSettle = vi.fn();
		const handle = cssTransition({ duration: 100, easing: 'linear' }).start(box(0), {
			kind: 'drop',
			emit: () => {},
			onSettle
		});

		handle.setTarget(box(1));
		vi.advanceTimersByTime(80);
		handle.setTarget(box(2));
		vi.advanceTimersByTime(80);
		expect(onSettle).not.toHaveBeenCalled();

		handle.stop();
		vi.advanceTimersByTime(100);
		expect(onSettle).not.toHaveBeenCalled();
		vi.useRealTimers();
	});
});

describe('resolveAnimationAdapter', () => {
	it('returns undefined for missing or incomplete legacy config', () => {
		expect(resolveAnimationAdapter(undefined)).toBeUndefined();
		expect(resolveAnimationAdapter({})).toBeUndefined();
		expect(resolveAnimationAdapter({ duration: 100 })).toBeUndefined();
		expect(resolveAnimationAdapter({ duration: 0, easing: 'linear' })).toBeUndefined();
	});

	it('wraps legacy { duration, easing } as a cssTransition', () => {
		const adapter = resolveAnimationAdapter({ duration: 100, easing: 'linear' });
		const handle = adapter!.start(box(0), { kind: 'move', emit: () => {}, onSettle: () => {} });
		handle.setTarget(box(1));
		expect(handle.extraStyle?.()).toBe('transition: all 100ms linear;');
		handle.stop();
	});

	it('passes adapters through untouched', () => {
		const adapter = cssTransition({ duration: 1, easing: 'linear' });
		expect(resolveAnimationAdapter(adapter)).toBe(adapter);
	});
});

describe('spring', () => {
	/** Drives rAF deterministically at 60fps. */
	function fakeRaf() {
		let now = 0;
		let queue: FrameRequestCallback[] = [];
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			queue.push(cb);
			return queue.length;
		});
		vi.stubGlobal('cancelAnimationFrame', () => {
			queue = [];
		});
		return {
			step(frames = 1) {
				for (let i = 0; i < frames; i++) {
					now += 1000 / 60;
					const cbs = queue;
					queue = [];
					for (const cb of cbs) {
						cb(now);
					}
				}
			}
		};
	}

	it('overshoots with bounce and settles on the target exactly', () => {
		const raf = fakeRaf();
		const emits: number[] = [];
		const onSettle = vi.fn();
		const handle = spring({ duration: 0.3, bounce: 0.4 }).start(box(0), {
			kind: 'move',
			emit: (v) => emits.push(v.left),
			onSettle
		});
		handle.setTarget(box(100));

		raf.step(120); // 2s
		expect(onSettle).toHaveBeenCalledOnce();
		expect(Math.max(...emits)).toBeGreaterThan(100);
		expect(emits.at(-1)).toBe(100);
		vi.unstubAllGlobals();
	});

	it('does not overshoot when critically damped', () => {
		const raf = fakeRaf();
		const emits: number[] = [];
		const handle = spring({ duration: 0.3 }).start(box(0), {
			kind: 'move',
			emit: (v) => emits.push(v.left),
			onSettle: () => {}
		});
		handle.setTarget(box(100));
		raf.step(120);
		expect(Math.max(...emits)).toBeLessThanOrEqual(100 + 1e-6);
		vi.unstubAllGlobals();
	});

	it('retargets mid-flight and stops cleanly', () => {
		const raf = fakeRaf();
		const emits: number[] = [];
		const onSettle = vi.fn();
		const handle = spring({ duration: 0.3 }).start(box(0), {
			kind: 'move',
			emit: (v) => emits.push(v.left),
			onSettle
		});
		handle.setTarget(box(100));
		raf.step(5);
		handle.setTarget(box(50));
		raf.step(120);
		expect(onSettle).toHaveBeenCalledOnce();
		expect(emits.at(-1)).toBe(50);

		handle.setTarget(box(500));
		handle.stop();
		const n = emits.length;
		raf.step(30);
		expect(emits.length).toBe(n);
		expect(onSettle).toHaveBeenCalledOnce();
		vi.unstubAllGlobals();
	});
});

describe('springTransitionConfig', () => {
	it('provides a spring adapter for every movement kind', () => {
		const config = springTransitionConfig();
		for (const kind of ['move', 'drop', 'resize'] as const) {
			expect(resolveAnimationAdapter(config[kind])).toBe(config[kind]);
		}
	});
});
