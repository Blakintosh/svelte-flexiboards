import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import {
	FlexiBoard,
	FlexiTarget,
	FlexiWidget,
	useFlexiBoard,
	useFlexiTarget
} from '../src/index.js';
import type { FlexiBoardController, FlexiBoardConfiguration } from '../src/index.js';
import { cells, flushTimers, mount, type Mounted } from './helpers.js';

let mounted: Mounted | undefined;

afterEach(async () => {
	mounted?.unmount();
	mounted = undefined;
	await flushTimers();
	document.body.innerHTML = '';
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

function Tile({ label }: { label: string }) {
	return <span className="tile">{label}</span>;
}

describe('widget rendering', () => {
	it('renders registry components with componentProps and children render functions', () => {
		const config: FlexiBoardConfiguration = {
			registry: {
				tile: { component: Tile, componentProps: { label: 'from-registry' } }
			}
		};
		mounted = mount(
			<FlexiBoard config={config}>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={0} y={0} width={1} height={1} type="tile" />
					<FlexiWidget
						x={1}
						y={0}
						width={1}
						height={1}
						component={Tile}
						componentProps={{ label: 'inline' }}
					/>
					<FlexiWidget x={2} y={0} width={1} height={1}>
						{({ widget }) => (
							<span className="fn">
								{widget.width}x{widget.height}
							</span>
						)}
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		const texts = cells().map((c) => c.textContent);
		expect(texts).toEqual(['from-registry', 'inline', '1x1']);
	});

	it('keeps the FlexiWidget declarations out of the grid flow', () => {
		mounted = mount(
			<FlexiBoard>
				<FlexiTarget keyName="left" config={freeLayout} className="grid">
					<FlexiWidget x={0} y={0} width={1} height={1}>
						a
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		);
		const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
		// Direct grid children are the hidden declarations wrapper and the
		// display:contents shields around each cell; nothing else may take a
		// grid cell of its own.
		const others = Array.from(grid.children).filter(
			(c) => (c as HTMLElement).style.display !== 'contents'
		);
		expect(others.length).toBe(1);
		expect((others[0] as HTMLElement).style.display).toBe('none');
		expect(cells(grid).length).toBe(1);
		expect(grid.className).toBe('grid');
	});

	it('renders header and footer as nodes or as functions of the reactive target', () => {
		mounted = mount(
			<FlexiBoard>
				<FlexiTarget
					keyName="left"
					config={freeLayout}
					containerClassName="container"
					header={<h2 className="h">head</h2>}
					footer={({ target }) => <p className="f">{target.key}</p>}
				>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						a
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		const container = document.querySelector<HTMLElement>('.container')!;
		expect(container.firstElementChild!.className).toBe('h');
		expect(container.lastElementChild!.className).toBe('f');
		expect(container.querySelector('.f')!.textContent).toBe('left');
	});

	it('applies the board style and the widget class function', () => {
		const cls = (w: { isGrabbed: boolean }) => (w.isGrabbed ? 'w grabbed' : 'w');
		mounted = mount(
			<FlexiBoard className="board">
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget x={1} y={2} width={1} height={1} className={cls}>
						a
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		);
		const cell = cells()[0];
		expect(cell.className).toBe('w');
		expect(cell.getAttribute('aria-colindex')).toBe('1');
		expect(cell.getAttribute('aria-rowindex')).toBe('2');
		// Core's placed style is a CSS string; it must survive the object conversion.
		expect(cell.style.gridColumnStart || cell.style.gridColumn).not.toBe('');
		expect(document.querySelector('.board')!.getAttribute('role')).toBe('application');
	});
});

describe('layout import/export through the controller', () => {
	it('exports the declared layout and re-renders on import', () => {
		let board: FlexiBoardController | undefined;
		function Reader() {
			const b = useFlexiBoard();
			const t = useFlexiTarget();
			return (
				<span className="reader">
					{b.exportLayout().left.length}/{t.widgets.size}
				</span>
			);
		}
		mounted = mount(
			<FlexiBoard
				onfirstcreate={(b) => (board = b)}
				config={{
					registry: {
						note: { component: Tile, componentProps: { label: 'note' } }
					}
				}}
			>
				<FlexiTarget keyName="left" config={freeLayout} footer={() => <Reader />}>
					<FlexiWidget x={0} y={0} width={1} height={1} type="note" metadata={{ id: 1 }}>
						{({ widget }) => <span>{String(widget.metadata?.id)}</span>}
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>,
			{ strict: true }
		);
		expect(board).toBeDefined();
		const exported = board!.exportLayout();
		expect(exported.left).toEqual([
			expect.objectContaining({
				type: 'note',
				x: 0,
				y: 0,
				width: 1,
				height: 1,
				metadata: { id: 1 }
			})
		]);

		act(() => {
			board!.importLayout({
				left: [
					{
						type: 'note',
						x: 0,
						y: 0,
						width: 1,
						height: 1,
						metadata: { id: 2 }
					},
					{
						type: 'note',
						x: 1,
						y: 0,
						width: 1,
						height: 1,
						metadata: { id: 3 }
					}
				]
			});
		});
		// Imported widgets render from the registry, not the declaration's children.
		expect(cells().map((c) => c.textContent)).toEqual(['note', 'note']);
		expect(document.querySelector('.reader')!.textContent).toBe('2/2');
	});
});
