import { afterEach, expect, it, vi } from 'vitest';
import { act, Suspense, useState } from 'react';
import {
	FlexiBoard,
	FlexiTarget,
	FlexiWidget,
	type FlexiBoardConfiguration
} from '../src/index.js';
import { cells, flushTimers, mount, type Mounted } from './helpers.js';

let mounted: Mounted | undefined;
const layout = {
	layout: { type: 'free', minColumns: 2, maxColumns: 2, minRows: 1, maxRows: 1 }
} as const;

afterEach(async () => {
	mounted?.unmount();
	mounted = undefined;
	await flushTimers();
	vi.restoreAllMocks();
	document.body.innerHTML = '';
});

it('adds keyed declarations once in StrictMode, updates their props and reports the layout', async () => {
	const onCreated = vi.fn();
	const onLayoutChange = vi.fn();
	const error = vi.spyOn(console, 'error').mockImplementation(() => {});
	function Board({ show, label }: { show: boolean; label: string }) {
		const [created, setCreated] = useState(false);
		return (
			<FlexiBoard config={{ onLayoutChange }}>
				<output>{created ? 'created' : 'waiting'}</output>
				<FlexiTarget keyName="cards" config={layout}>
					<FlexiWidget key="first" id="first" x={0} y={0} draggability="none">
						First
					</FlexiWidget>
					{show && (
						<FlexiWidget
							key="late"
							id="late"
							x={1}
							y={0}
							onfirstcreate={(widget) => {
								onCreated(widget);
								setCreated(true);
							}}
						>
							{label}
						</FlexiWidget>
					)}
				</FlexiTarget>
			</FlexiBoard>
		);
	}
	mounted = mount(<Board show={false} label="Late" />, { strict: true });
	expect(cells().map((cell) => cell.textContent)).toEqual(['First']);
	mounted.render(<Board show label="Late" />);
	await act(async () => {
		await Promise.resolve();
	});
	expect(cells().map((cell) => cell.textContent)).toEqual(['First', 'Late']);
	expect(document.querySelector('output')?.textContent).toBe('created');
	expect(onCreated).toHaveBeenCalledOnce();
	expect(onLayoutChange).toHaveBeenCalledOnce();
	expect(onLayoutChange.mock.calls[0][0].cards).toHaveLength(2);
	mounted.render(<Board show label="Updated" />);
	expect(cells().map((cell) => cell.textContent)).toEqual(['First', 'Updated']);
	expect(onCreated).toHaveBeenCalledOnce();
	expect(error).not.toHaveBeenCalled();
});

it.each([0, 2])('rejects a late declaration at blocked or out-of-bounds x=%s', async (x) => {
	const onCreated = vi.fn();
	const onLayoutChange = vi.fn();
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const tree = (show: boolean) => (
		<FlexiBoard config={{ onLayoutChange }}>
			<FlexiTarget keyName="cards" config={layout}>
				<FlexiWidget id="fixed" x={0} y={0} draggability="none">
					Fixed
				</FlexiWidget>
				{show && (
					<FlexiWidget x={x} y={0} onfirstcreate={onCreated}>
						Rejected
					</FlexiWidget>
				)}
			</FlexiTarget>
		</FlexiBoard>
	);
	mounted = mount(tree(false), { strict: true });
	mounted.render(tree(true));
	await act(async () => {
		await Promise.resolve();
	});
	expect(cells().map((cell) => cell.textContent)).toEqual(['Fixed']);
	expect(onCreated).not.toHaveBeenCalled();
	expect(onLayoutChange).not.toHaveBeenCalled();
	expect(warn).toHaveBeenCalledOnce();
});

it('does not create a late widget from a suspended render that never commits', async () => {
	const pending = new Promise<never>(() => {});
	const onCreated = vi.fn();
	function Suspend() {
		throw pending;
	}
	const tree = (show: boolean) => (
		<FlexiBoard>
			<FlexiTarget keyName="cards" config={layout}>
				<FlexiWidget x={0} y={0}>
					First
				</FlexiWidget>
				<Suspense fallback={null}>
					{show && (
						<>
							<FlexiWidget x={1} y={0} onfirstcreate={onCreated}>
								Uncommitted
							</FlexiWidget>
							<Suspend />
						</>
					)}
				</Suspense>
			</FlexiTarget>
		</FlexiBoard>
	);
	mounted = mount(tree(false), { strict: true });
	mounted.render(tree(true));
	mounted.render(tree(false));
	await act(async () => {
		await Promise.resolve();
	});
	expect(cells().map((cell) => cell.textContent)).toEqual(['First']);
	expect(onCreated).not.toHaveBeenCalled();
});

it('adds a late declaration alongside an imported initial layout', () => {
	const config: FlexiBoardConfiguration = {
		registry: { card: { component: () => <span>Saved</span> } },
		initialLayout: { cards: [{ id: 'saved', type: 'card', x: 0, y: 0, width: 1, height: 1 }] }
	};
	const tree = (show: boolean) => (
		<FlexiBoard config={config}>
			<FlexiTarget keyName="cards" config={layout}>
				<FlexiWidget x={0} y={0}>
					Fallback
				</FlexiWidget>
				{show && (
					<FlexiWidget x={1} y={0}>
						Late
					</FlexiWidget>
				)}
			</FlexiTarget>
		</FlexiBoard>
	);
	mounted = mount(tree(false), { strict: true });
	mounted.render(tree(true));
	expect(cells().map((cell) => cell.textContent)).toEqual(['Saved', 'Late']);
});
