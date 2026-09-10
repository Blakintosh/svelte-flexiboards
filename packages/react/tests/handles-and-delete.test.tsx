import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import {
	FlexiBoard,
	FlexiDelete,
	FlexiGrab,
	FlexiResize,
	FlexiTarget,
	FlexiWidget,
	useFlexiWidget
} from '../src/index.js';
import type { FlexiDeleteController } from '../src/index.js';
import {
	cells,
	flushTimers,
	keydown,
	layoutGrid,
	mount,
	pointerMove,
	realCells,
	setRect,
	type Mounted
} from './helpers.js';

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

/** Reads reactive widget state through the public hook. */
function Status() {
	const widget = useFlexiWidget();
	return (
		<span className="status">
			{widget.isGrabbed ? 'grabbed' : 'idle'}:{widget.x},{widget.y}
		</span>
	);
}

// The shadow renders the same children, so read the status of the real widget
// (which may have been lifted into the portal).
const status = () =>
	document.querySelector('[role="cell"]:not([aria-label="Widget action preview"]) .status')!
		.textContent;

describe('keyboard grab via FlexiGrab', () => {
	it('grabs on Enter, exposes isGrabbed through useFlexiWidget, and cancels on Escape', () => {
		mounted = mount(
			<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						<FlexiGrab className="grab">grab</FlexiGrab>
						<Status />
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		layoutGrid();
		const grab = document.querySelector<HTMLButtonElement>('button.grab')!;
		expect(grab.disabled).toBe(false);
		expect(grab.style.cursor).toBe('grab');
		expect(status()).toBe('idle:0,0');
		// A widget with a grab handle is not itself focusable.
		expect(cells()[0].hasAttribute('tabindex')).toBe(false);

		keydown(grab, 'Enter');
		expect(status()).toBe('grabbed:0,0');
		expect(realCells()[0].getAttribute('aria-grabbed')).toBe('true');
		// The grabbed widget is lifted into the portal while a shadow marks the drop.
		expect(document.getElementById('flexi-portal')!.contains(realCells()[0])).toBe(true);
		expect(cells().length).toBe(2);

		// Escape reaches the board's window listener and cancels the action.
		keydown(window, 'Escape');
		expect(status()).toBe('idle:0,0');
		expect(cells().length).toBe(1);
		expect(cells()[0].getAttribute('aria-grabbed')).toBe('false');
		expect(document.getElementById('flexi-portal')!.children.length).toBe(0);
	});

	it('accepts a class function that tracks widget state', () => {
		mounted = mount(
			<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						<FlexiGrab className={(w) => (w.isGrabbed ? 'grab held' : 'grab')}>grab</FlexiGrab>
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		layoutGrid();
		const grab = () =>
			document.querySelector<HTMLButtonElement>(
				'[role="cell"]:not([aria-label="Widget action preview"]) button'
			)!;
		expect(grab().className).toBe('grab');
		keydown(grab(), 'Enter');
		expect(grab().className).toBe('grab held');
		keydown(window, 'Escape');
		expect(grab().className).toBe('grab');
	});

	it('confirms a keyboard move on Enter', () => {
		mounted = mount(
			<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						<FlexiGrab className="grab">grab</FlexiGrab>
						<Status />
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		layoutGrid();
		keydown(document.querySelector('button.grab')!, 'Enter');
		expect(status()).toBe('grabbed:0,0');

		// Move the (keyboard-driven) pointer into the second column and confirm.
		pointerMove(150, 50);
		keydown(window, 'Enter');
		expect(status()).toBe('idle:1,0');
		expect(cells().length).toBe(1);
		expect(cells()[0].getAttribute('aria-colindex')).toBe('1');
	});

	it('leaves the handles inert when the widget is immovable', () => {
		mounted = mount(
			<FlexiBoard
				config={{
					widgetDefaults: { draggability: 'none', resizability: 'none' }
				}}
			>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						<FlexiGrab className="grab">grab</FlexiGrab>
						<FlexiResize className="resize">resize</FlexiResize>
						<Status />
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		);
		layoutGrid();
		const grab = document.querySelector<HTMLButtonElement>('button.grab')!;
		const resize = document.querySelector<HTMLButtonElement>('button.resize')!;
		expect(grab.disabled).toBe(true);
		expect(resize.disabled).toBe(true);
		expect(grab.style.cursor).toBe('not-allowed');
		keydown(grab, 'Enter');
		expect(status()).toBe('idle:0,0');
	});
});

describe('grabbing the widget body', () => {
	it('is focusable and grabs on Enter when there is no grab handle', () => {
		mounted = mount(
			<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						<Status />
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		layoutGrid();
		expect(cells()[0].getAttribute('tabindex')).toBe('0');
		keydown(cells()[0], 'Enter');
		// Mid-grab coordinates track the pointer's cell, so only assert the state.
		expect(status()).toMatch(/^grabbed:/);
	});
});

describe('FlexiDelete', () => {
	it('deletes a grabbed widget released over the deleter, and reflects hover through the class function', () => {
		let deleterController: FlexiDeleteController | undefined;
		mounted = mount(
			<FlexiBoard config={{ widgetDefaults: { draggability: 'full' } }}>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						<Status />
					</FlexiWidget>
					<FlexiWidget x={1} y={0} width={1} height={1}>
						keep
					</FlexiWidget>
				</FlexiTarget>
				<FlexiDelete
					className={(d) => (d.isHovered ? 'deleter hot' : 'deleter')}
					onfirstcreate={(d) => (deleterController = d)}
				>
					{({ deleter }) => <span className="hover">{deleter.isHovered ? 'over' : 'away'}</span>}
				</FlexiDelete>
			</FlexiBoard>,
			{ strict: true }
		);
		layoutGrid();
		const deleter = document.querySelector<HTMLElement>('.deleter')!;
		setRect(deleter, { left: 0, top: 500, width: 100, height: 100 });
		expect(deleterController).toBeDefined();
		expect(cells().length).toBe(2);

		keydown(cells()[0], 'Enter');
		expect(status()).toMatch(/^grabbed:/);

		pointerMove(50, 550);
		expect(deleter.className).toBe('deleter hot');
		expect(document.querySelector('.hover')!.textContent).toBe('over');
		expect(deleterController!.isHovered).toBe(true);

		keydown(window, 'Enter');
		expect(cells().length).toBe(1);
		expect(cells()[0].textContent).toBe('keep');
		expect(document.getElementById('flexi-portal')!.children.length).toBe(0);

		// The pointer left with the drop: hover state must not linger.
		act(() => {
			window.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 50 }));
		});
		expect(deleter.className).toBe('deleter');
	});
});
