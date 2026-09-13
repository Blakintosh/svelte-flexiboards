// @vitest-environment happy-dom
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
import { describe, expect, it } from 'vitest';
import { act, StrictMode, useLayoutEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { signal, ReactiveMap, ReactiveSet } from '@flexiboards/core';
import { useReactive } from './reactive.js';

// A stand-in for a core controller: signal-backed getters plus a method.
function makeController() {
	const count = signal(0);
	const label = signal('a');
	return {
		reads: 0,
		get count() {
			this.reads++;
			return count();
		},
		get label() {
			return label();
		},
		bump() {
			count(count() + 1);
		},
		relabel(v: string) {
			label(v);
		}
	};
}

function mount(node: React.ReactNode) {
	const host = document.createElement('div');
	document.body.appendChild(host);
	let root!: Root;
	act(() => {
		root = createRoot(host);
		root.render(node);
	});
	return { host, unmount: () => act(() => root.unmount()) };
}

describe('useReactive', () => {
	it('catches signal changes between render and subscription, including StrictMode', () => {
		const controller = makeController();
		function View() {
			const c = useReactive(controller);
			useLayoutEffect(() => controller.relabel('committed'), []);
			return <span>{c.label}</span>;
		}
		const { host, unmount } = mount(
			<StrictMode>
				<View />
			</StrictMode>
		);
		expect(host.textContent).toBe('committed');
		unmount();
	});

	it('tracks membership, order and values of controller collections', () => {
		const controller = {
			widgets: new ReactiveSet<string>(),
			labels: new ReactiveMap<string, string>()
		};
		function View() {
			const c = useReactive(controller);
			return (
				<span>
					{c.widgets.size}:{[...c.widgets].join(',')}:{c.labels.get('a')}
				</span>
			);
		}
		const { host, unmount } = mount(<View />);
		act(() => controller.widgets.add('a'));
		expect(host.textContent).toBe('1:a:');
		act(() => controller.labels.set('a', 'first'));
		expect(host.textContent).toBe('1:a:first');
		act(() => controller.labels.set('a', 'second'));
		expect(host.textContent).toBe('1:a:second');
		act(() => controller.widgets.clear());
		expect(host.textContent).toBe('0::second');
		unmount();
	});
	it('re-renders when a getter read during render changes, with bare property access', () => {
		const controller = makeController();
		let renders = 0;
		function View() {
			const c = useReactive(controller);
			renders++;
			return <span>{c.count}</span>;
		}
		const { host, unmount } = mount(<View />);
		expect(host.textContent).toBe('0');
		const before = renders;

		act(() => controller.bump());
		expect(host.textContent).toBe('1');
		expect(renders).toBe(before + 1);
		unmount();
	});

	it('does not re-render for signals it never read during render', () => {
		const controller = makeController();
		let renders = 0;
		function View() {
			const c = useReactive(controller);
			renders++;
			return <span>{c.count}</span>;
		}
		const { unmount } = mount(<View />);
		const before = renders;
		act(() => controller.relabel('b'));
		expect(renders).toBe(before);
		unmount();
	});

	it('tolerates conditional reads across renders (fixed hook count)', () => {
		const controller = makeController();
		function View() {
			const c = useReactive(controller);
			// Branch changes which keys are touched between renders.
			return <span>{c.count % 2 === 0 ? c.label : 'odd'}</span>;
		}
		const { host, unmount } = mount(<View />);
		expect(host.textContent).toBe('a');
		act(() => controller.bump());
		expect(host.textContent).toBe('odd');
		act(() => controller.bump());
		expect(host.textContent).toBe('a');
		// label was first read on render 1 and is tracked from then on.
		act(() => controller.relabel('c'));
		expect(host.textContent).toBe('c');
		unmount();
	});

	it('binds methods to the controller and stops on unmount', () => {
		const controller = makeController();
		let renders = 0;
		function View() {
			const c = useReactive(controller);
			renders++;
			return <button onClick={c.bump}>{c.count}</button>;
		}
		const { host, unmount } = mount(<View />);
		act(() => host.querySelector('button')!.click());
		expect(host.textContent).toBe('1');
		unmount();
		const after = renders;
		act(() => controller.bump());
		expect(renders).toBe(after);
	});
});
