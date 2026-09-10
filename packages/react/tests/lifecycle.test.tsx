import { describe, it, expect, afterEach, vi } from 'vitest';
import { InternalFlexiBoardController, InternalFlexiTargetController } from '@flexiboards/core';
import { FlexiBoard, FlexiTarget, FlexiWidget } from '../src/index.js';
import type {
	FlexiBoardController,
	FlexiTargetController,
	FlexiWidgetController
} from '../src/index.js';
import { cells, flushTimers, mount, type Mounted } from './helpers.js';

let mounted: Mounted | undefined;

afterEach(async () => {
	mounted?.unmount();
	mounted = undefined;
	await flushTimers();
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

const freeLayout = {
	layout: {
		type: 'free',
		minColumns: 3,
		maxColumns: 3,
		minRows: 3,
		maxRows: 3
	}
} as const;

describe('lifecycle under StrictMode', () => {
	it('creates each declared widget exactly once and fires onfirstcreate once per component', () => {
		const boards: FlexiBoardController[] = [];
		const targets: FlexiTargetController[] = [];
		const widgets: FlexiWidgetController[] = [];

		mounted = mount(
			<FlexiBoard onfirstcreate={(b) => boards.push(b)} config={{ registry: { t: {} } }}>
				<FlexiTarget keyName="left" config={freeLayout} onfirstcreate={(t) => targets.push(t)}>
					<FlexiWidget
						type="t"
						x={0}
						y={0}
						width={1}
						height={1}
						onfirstcreate={(w) => widgets.push(w)}
					>
						a
					</FlexiWidget>
					<FlexiWidget
						type="t"
						x={1}
						y={0}
						width={1}
						height={1}
						onfirstcreate={(w) => widgets.push(w)}
					>
						b
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);

		expect(cells().map((c) => c.textContent)).toEqual(['a', 'b']);
		expect(boards.length).toBe(1);
		expect(targets.length).toBe(1);
		expect(widgets.length).toBe(2);
		// The controllers handed out are the ones backing the rendered widgets.
		expect(boards[0].exportLayout().left.length).toBe(2);
	});

	it('keeps one controller alive through the simulated remount, and destroys it only on real unmount', async () => {
		const boardDestroy = vi.spyOn(InternalFlexiBoardController.prototype, 'destroy');
		const targetDestroy = vi.spyOn(InternalFlexiTargetController.prototype, 'destroy');

		mounted = mount(
			<FlexiBoard>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						a
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		await flushTimers();

		// StrictMode's fake unmount scheduled destroys that the remount cancelled.
		expect(boardDestroy).not.toHaveBeenCalled();
		expect(targetDestroy).not.toHaveBeenCalled();
		expect(cells().length).toBe(1);

		mounted.unmount();
		mounted = undefined;
		await flushTimers();

		expect(boardDestroy).toHaveBeenCalledTimes(1);
		// Once from its own cleanup and once cascaded from the board, as in Svelte.
		expect(targetDestroy).toHaveBeenCalled();
		// Window listeners are gone: a stray pointerup must not reach a dead board.
		expect(() => window.dispatchEvent(new Event('pointerup'))).not.toThrow();
	});

	it('survives mounting a second board after the first has been torn down (shared portal refcount)', async () => {
		const tree = (
			<FlexiBoard>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						a
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		);
		mounted = mount(tree, { strict: true });
		mounted.unmount();
		await flushTimers();
		mounted = mount(tree, { strict: true });
		expect(cells().length).toBe(1);
		expect(document.getElementById('flexi-portal')).not.toBeNull();
	});

	it('renders two boards side by side without cross-talk', () => {
		mounted = mount(
			<>
				<FlexiBoard className="one">
					<FlexiTarget keyName="t" config={freeLayout}>
						<FlexiWidget x={0} y={0} width={1} height={1}>
							one
						</FlexiWidget>
					</FlexiTarget>
				</FlexiBoard>
				<FlexiBoard className="two">
					<FlexiTarget keyName="t" config={freeLayout}>
						<FlexiWidget x={0} y={0} width={1} height={1}>
							two-a
						</FlexiWidget>
						<FlexiWidget x={1} y={0} width={1} height={1}>
							two-b
						</FlexiWidget>
					</FlexiTarget>
				</FlexiBoard>
			</>,
			{ strict: true }
		);
		expect(cells(document.querySelector('.one')!).length).toBe(1);
		expect(cells(document.querySelector('.two')!).length).toBe(2);
	});
});
