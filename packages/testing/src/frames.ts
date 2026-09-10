/**
 * Drop flights and springs run on `requestAnimationFrame`, which a test DOM
 * never advances. This queues frame callbacks so a test can run them one
 * frame at a time and inspect the element between frames.
 */
export function mockFrames() {
	let frames: FrameRequestCallback[] = [];
	const original = globalThis.requestAnimationFrame;
	const originalCancel = globalThis.cancelAnimationFrame;
	globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
		frames.push(cb);
		return frames.length;
	};
	globalThis.cancelAnimationFrame = () => {};
	return {
		/** How many callbacks wait for the next frame. */
		get pending() {
			return frames.length;
		},
		/** Runs every waiting callback once, with `now` as the timestamp. */
		flush(now = performance.now()) {
			const batch = frames;
			frames = [];
			batch.forEach((cb) => cb(now));
		},
		restore() {
			globalThis.requestAnimationFrame = original;
			globalThis.cancelAnimationFrame = originalCancel;
			frames = [];
		}
	};
}
