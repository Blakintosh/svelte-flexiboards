// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { isSsrEnvironment, markSsrEnvironment } from '@flexiboards/core';
import {
	FlexiAdd,
	FlexiBoard,
	FlexiDelete,
	FlexiGrab,
	FlexiTarget,
	FlexiWidget,
	ResponsiveFlexiBoard
} from '../src/index.js';

const freeLayout = {
	layout: {
		type: 'free',
		minColumns: 3,
		maxColumns: 3,
		minRows: 3,
		maxRows: 3
	}
} as const;

describe('server rendering', () => {
	beforeEach(() => markSsrEnvironment(false));

	it('marks a responsive board before loading storage or choosing its SSR breakpoint', () => {
		const loadLayouts = vi.fn(() => {
			throw new Error('client storage is unavailable');
		});
		const html = renderToString(
			<ResponsiveFlexiBoard
				config={{ breakpoints: { lg: 1024 }, ssrBreakpoint: 'lg', loadLayouts }}
				lg={
					<FlexiBoard>
						<FlexiTarget keyName="main">
							<FlexiWidget>desktop content</FlexiWidget>
						</FlexiTarget>
					</FlexiBoard>
				}
			>
				<p>wrong breakpoint</p>
			</ResponsiveFlexiBoard>
		);
		expect(html).toContain('desktop content');
		expect(html).not.toContain('wrong breakpoint');
		expect(loadLayouts).not.toHaveBeenCalled();
	});

	it('server-renders initialLayout registry content and computed flow dimensions', () => {
		const html = renderToString(
			<FlexiBoard
				config={{
					registry: { card: { snippet: () => 'saved content' } },
					initialLayout: {
						main: [
							{ type: 'card', x: 0, y: 0, width: 1, height: 1 },
							{ type: 'card', x: 0, y: 1, width: 1, height: 1 }
						]
					}
				}}
			>
				<FlexiTarget keyName="main">
					<FlexiWidget>fallback content</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		);
		expect(html.match(/saved content/g)).toHaveLength(2);
		expect(html).not.toContain('fallback content');
		expect(html).toContain('aria-rowcount="2"');
	});
	it('renders a board to a string without a DOM and marks the SSR environment', () => {
		const html = renderToString(
			<FlexiBoard className="board">
				<FlexiAdd addWidget={() => ({ widget: { width: 1, height: 1 } })}>add</FlexiAdd>
				<FlexiTarget keyName="left" config={freeLayout} header={<h2>head</h2>}>
					<FlexiWidget x={0} y={0} width={1} height={1}>
						<FlexiGrab>grab</FlexiGrab>
					</FlexiWidget>
				</FlexiTarget>
				<FlexiDelete>bin</FlexiDelete>
			</FlexiBoard>
		);
		expect(html).toContain('role="application"');
		expect(html).toContain('role="grid"');
		expect(html).toContain('<h2>head</h2>');
		expect(html).toContain('role="gridcell"');
		expect(html).toContain('>grab</button>');
		expect(isSsrEnvironment()).toBe(true);
	});

	it('is repeatable across requests', () => {
		for (let i = 0; i < 3; i++) {
			const html = renderToString(
				<FlexiBoard>
					<FlexiTarget keyName="left" config={freeLayout}>
						<FlexiWidget x={0} y={0} width={1} height={1}>
							a
						</FlexiWidget>
					</FlexiTarget>
				</FlexiBoard>
			);
			expect(html).toContain('role="grid"');
		}
	});
});
