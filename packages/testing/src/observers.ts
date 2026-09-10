/**
 * A DOM without layout never fires ResizeObserver callbacks, so core never
 * learns the grid's size and every pointer position resolves to nothing. This
 * stand-in records observers so a test can fire them after stubbing geometry.
 */
export class MockResizeObserver {
	static instances = new Set<MockResizeObserver>();
	constructor(private cb: ResizeObserverCallback) {}
	observe() {
		MockResizeObserver.instances.add(this);
	}
	unobserve() {}
	disconnect() {
		MockResizeObserver.instances.delete(this);
	}
	/** Invokes every live observer once. */
	static fire() {
		for (const o of MockResizeObserver.instances) {
			o.cb([{} as ResizeObserverEntry], o as unknown as ResizeObserver);
		}
	}
}

/**
 * Installs the mock as the global `ResizeObserver`. Returns a function that
 * puts the original back.
 */
export function installResizeObserver() {
	const original = globalThis.ResizeObserver;
	globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
	return () => {
		globalThis.ResizeObserver = original;
		MockResizeObserver.instances.clear();
	};
}
