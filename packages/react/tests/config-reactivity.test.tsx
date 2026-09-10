import { describe, it, expect, afterEach } from 'vitest';
import { useState } from 'react';
import { act } from 'react';
import { FlexiBoard, FlexiGrab, FlexiResize, FlexiTarget, FlexiWidget } from '../src/index.js';
import type { FlexiBoardConfiguration, FlexiTargetPartialConfiguration } from '../src/index.js';
import { cells, flushTimers, mount, type Mounted } from './helpers.js';

let mounted: Mounted | undefined;

afterEach(async () => {
	mounted?.unmount();
	mounted = undefined;
	await flushTimers();
	document.body.innerHTML = '';
});

const grabButton = () => document.querySelector<HTMLButtonElement>('button.grab');
const resizeButton = () => document.querySelector<HTMLButtonElement>('button.resize');

const freeLayout: FlexiTargetPartialConfiguration = {
	layout: {
		type: 'free',
		minColumns: 3,
		maxColumns: 3,
		minRows: 3,
		maxRows: 3
	}
};

let toggleEditMode: () => void;

function EditModeBoard() {
	// Mirrors the dashboard example: a config in state whose widgetDefaults is
	// replaced when edit mode toggles.
	const [editMode, setEditMode] = useState(false);
	toggleEditMode = () => setEditMode((v) => !v);

	const config: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggability: editMode ? 'full' : 'none',
			resizability: editMode ? 'horizontal' : 'none'
		}
	};

	return (
		<FlexiBoard config={config}>
			<FlexiTarget keyName="left" config={freeLayout}>
				<FlexiWidget x={0} y={0} width={1} height={1}>
					<FlexiGrab className="grab">grab</FlexiGrab>
					<FlexiResize className="resize">resize</FlexiResize>
				</FlexiWidget>
			</FlexiTarget>
		</FlexiBoard>
	);
}

describe.each([{ strict: false }, { strict: true }])(
	'board config reactivity (strict: $strict)',
	({ strict }) => {
		it('enables the grab and resize handles when widgetDefaults change', () => {
			mounted = mount(<EditModeBoard />, { strict });

			expect(grabButton()).not.toBeNull();
			expect(grabButton()!.disabled).toBe(true);
			expect(resizeButton()!.disabled).toBe(true);

			act(() => toggleEditMode());
			expect(grabButton()!.disabled).toBe(false);
			expect(resizeButton()!.disabled).toBe(false);

			act(() => toggleEditMode());
			expect(grabButton()!.disabled).toBe(true);
			expect(resizeButton()!.disabled).toBe(true);
		});
	}
);

describe('widget prop reactivity', () => {
	it('pushes changed FlexiWidget props into the rendered widget', () => {
		let setDraggability!: (d: 'none' | 'full') => void;
		let setCls!: (c: string) => void;
		function Board() {
			const [draggability, _setDraggability] = useState<'none' | 'full'>('none');
			const [cls, _setCls] = useState('a');
			setDraggability = _setDraggability;
			setCls = _setCls;
			return (
				<FlexiBoard>
					<FlexiTarget keyName="left" config={freeLayout}>
						<FlexiWidget
							x={0}
							y={0}
							width={1}
							height={1}
							className={cls}
							draggability={draggability}
						>
							content
						</FlexiWidget>
					</FlexiTarget>
				</FlexiBoard>
			);
		}
		mounted = mount(<Board />, { strict: true });

		const cell = () => cells()[0];
		expect(cell().className).toBe('a');
		expect(cell().hasAttribute('aria-dropeffect')).toBe(false);

		act(() => setCls('b'));
		expect(cell().className).toBe('b');

		act(() => setDraggability('full'));
		expect(cell().getAttribute('aria-dropeffect')).toBe('move');
		expect(cell().getAttribute('tabindex')).toBe('0');
	});

	it('re-renders plain-node children when the parent re-renders', () => {
		let setLabel!: (s: string) => void;
		function Board() {
			const [label, _setLabel] = useState('one');
			setLabel = _setLabel;
			return (
				<FlexiBoard>
					<FlexiTarget keyName="left" config={freeLayout}>
						<FlexiWidget x={0} y={0} width={1} height={1}>
							<span className="label">{label}</span>
						</FlexiWidget>
					</FlexiTarget>
				</FlexiBoard>
			);
		}
		mounted = mount(<Board />, { strict: true });
		expect(document.querySelector('.label')!.textContent).toBe('one');
		act(() => setLabel('two'));
		expect(document.querySelector('.label')!.textContent).toBe('two');
	});
});

describe('target config reactivity', () => {
	it('pushes changed target config into the target controller', () => {
		let setRowSizing!: (s: string) => void;
		function Board() {
			const [rowSizing, _setRowSizing] = useState('minmax(1rem, auto)');
			setRowSizing = _setRowSizing;
			return (
				<FlexiBoard>
					<FlexiTarget
						keyName="left"
						config={{ ...freeLayout, rowSizing }}
						footer={({ target }) => (
							<span className="sizing">{String(target.config.rowSizing)}</span>
						)}
					>
						<FlexiWidget x={0} y={0} width={1} height={1}>
							w
						</FlexiWidget>
					</FlexiTarget>
				</FlexiBoard>
			);
		}
		mounted = mount(<Board />, { strict: true });
		const sizing = () => document.querySelector('.sizing')!.textContent;
		const grid = () => document.querySelector<HTMLElement>('[role="grid"]')!;
		expect(sizing()).toBe('minmax(1rem, auto)');
		expect(grid().style.gridTemplateRows).toContain('minmax(1rem, auto)');
		act(() => setRowSizing('minmax(0, 180px)'));
		expect(sizing()).toBe('minmax(0, 180px)');
		expect(grid().style.gridTemplateRows).toContain('minmax(0, 180px)');
	});
});
