// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FlexiBoard, FlexiTarget, FlexiWidget, ResponsiveFlexiBoard } from '../src/index.js';

const freeLayout = {
	layout: {
		type: 'free',
		minColumns: 3,
		maxColumns: 3,
		minRows: 3,
		maxRows: 3
	}
} as const;

describe('suspense on the server', () => {
	it('renders the fallback beside hidden content while a stored layout is pending', () => {
		const html = renderToString(
			<FlexiBoard
				config={{ loadLayout: () => ({ left: [] }), registry: { t: {} } }}
				suspense={(reason) => <p className="skeleton">{reason.reason}</p>}
			>
				<FlexiTarget keyName="left" config={freeLayout}>
					<FlexiWidget type="t" x={0} y={0} width={1} height={1}>
						a
					</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		);
		expect(html).toContain('data-flexi-pending="layout"');
		expect(html).toContain('aria-busy="true"');
		expect(html).toContain('<p class="skeleton">layout</p>');
		expect(html).toMatch(/data-flexi-content="[^"]+" style="display:none"/);
		expect(html).toContain('inert=""');
	});

	it('gates a breakpoint guess with a media query and renders plainly without a suspense prop', () => {
		const withSuspense = renderToString(
			<ResponsiveFlexiBoard config={{ breakpoints: { lg: 1024 }, ssrBreakpoint: 'lg' }}>
				<FlexiBoard suspense={(reason) => <p className="skeleton">{reason.reason}</p>}>
					<FlexiTarget keyName="left" config={freeLayout} />
				</FlexiBoard>
			</ResponsiveFlexiBoard>
		);
		expect(withSuspense).toContain('<p class="skeleton">breakpoint</p>');
		expect(withSuspense).toMatch(/<style media="\(min-width: 1024px\)">/);

		const plain = renderToString(
			<FlexiBoard>
				<FlexiTarget keyName="left" config={freeLayout} />
			</FlexiBoard>
		);
		expect(plain).not.toContain('data-flexi-fallback');
		expect(plain).not.toContain('aria-busy');
	});
});
