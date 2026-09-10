// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { isSsrEnvironment } from '@flexiboards/core';
import {
	FlexiAdd,
	FlexiBoard,
	FlexiDelete,
	FlexiGrab,
	FlexiTarget,
	FlexiWidget
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
