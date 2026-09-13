import { afterEach, describe, expect, it, vi } from 'vitest';
import { cssTransition, resolveAnimationAdapter, spring, type AnimationBox } from './animation.js';
import { cssTransitionConfig, simpleTransitionConfig, springTransitionConfig } from './index.js';

const box = (n: number): AnimationBox => ({ left: n, top: n, width: n, height: n });

afterEach(() => vi.unstubAllGlobals());

describe('CSS presets', () => {
	it('retains the original timing and easing in the deprecated simple preset', () => {
		expect(simpleTransitionConfig()).toEqual({
			move: { duration: 150, easing: 'ease-in-out' },
			drop: { duration: 150, easing: 'ease-out' },
			resize: { duration: 150, easing: 'ease-out' }
		});
	});

	it('keeps a CSS drop active for its full 200ms and emits the overridable circ curve', () => {
		vi.useFakeTimers();
		try {
			const onSettle = vi.fn();
			const handle = resolveAnimationAdapter(cssTransitionConfig().drop)!.start(box(0), {
				kind: 'drop',
				emit: () => {},
				onSettle
			});
			handle.setTarget(box(100));
			expect(handle.extraStyle?.()).toBe(
				'transition: all 200ms var(--ease-flexi-drop, cubic-bezier(0, 0.55, 0.45, 1));'
			);
			vi.advanceTimersByTime(199);
			expect(onSettle).not.toHaveBeenCalled();
			vi.advanceTimersByTime(1);
			expect(onSettle).toHaveBeenCalledOnce();
		} finally {
			vi.useRealTimers();
		}
	});

	it('keeps caller customisation local to each preset instance', () => {
		const config = cssTransitionConfig();
		config.move = undefined;
		expect(cssTransitionConfig().move).toBeDefined();
		expect(simpleTransitionConfig().move).toEqual({ duration: 150, easing: 'ease-in-out' });
	});
});

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

function fakeRaf(fps = 60) {
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
				now += 1000 / fps;
				const cbs = queue;
				queue = [];
				for (const cb of cbs) {
					cb(now);
				}
			}
		}
	};
}

describe('spring', () => {
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
	});
});

describe('springTransitionConfig', () => {
	it('provides a spring adapter for every movement kind', () => {
		const config = springTransitionConfig();
		for (const kind of ['move', 'drop', 'resize'] as const) {
			expect(resolveAnimationAdapter(config[kind])).toBe(config[kind]);
		}
	});

	for (const kind of ['move', 'drop', 'resize'] as const) {
		it.each([30, 60, 120, 144])(
			`${kind} settles promptly with bounded overshoot at %ifps`,
			(fps) => {
				const raf = fakeRaf(fps);
				const values: number[] = [];
				const onSettle = vi.fn();
				const handle = resolveAnimationAdapter(springTransitionConfig()[kind])!.start(box(0), {
					kind,
					emit: (value) => values.push(value.left),
					onSettle
				});
				handle.setTarget(box(300));
				raf.step(Math.floor(fps * 0.55));

				expect(onSettle).toHaveBeenCalledOnce();
				expect(values.at(-1)).toBe(300);
				expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
				expect(Math.max(...values)).toBeLessThanOrEqual(kind === 'resize' ? 300 : 306);
			}
		);

		it(`${kind} follows the same path across frame rates`, () => {
			const positions = [30, 60, 120].map((fps) => {
				const raf = fakeRaf(fps);
				let position = 0;
				const handle = resolveAnimationAdapter(springTransitionConfig()[kind])!.start(box(0), {
					kind,
					emit: (value) => (position = value.left),
					onSettle: () => {}
				});
				handle.setTarget(box(300));
				raf.step(1 + fps * 0.2);
				handle.stop();
				return position;
			});
			expect(positions[0]).toBeCloseTo(positions[1], 6);
			expect(positions[1]).toBeCloseTo(positions[2], 6);
		});
	}
});
