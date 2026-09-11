import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { markSsrEnvironment } from '@flexiboards/core';
import { FlexiBoard, FlexiTarget, FlexiWidget, ResponsiveFlexiBoard } from '../src/index.js';
import { flushTimers } from './helpers.js';

let root: Root | undefined;

afterEach(async () => {
	if (root) await act(async () => root!.unmount());
	root = undefined;
	await flushTimers();
	markSsrEnvironment(false);
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

function serverRender(tree: ReactNode) {
	markSsrEnvironment(true);
	try {
		return renderToString(tree);
	} finally {
		markSsrEnvironment(false);
	}
}

async function hydrate(tree: ReactNode, html: string, preserveCell = false) {
	const host = document.createElement('div');
	document.body.appendChild(host);
	host.innerHTML = html;
	const originalCell = host.querySelector('[role="cell"]');
	const errors = vi.fn();
	const consoleError = vi.spyOn(console, 'error');
	await act(async () => {
		root = hydrateRoot(host, tree, { onRecoverableError: errors });
	});
	expect(errors).not.toHaveBeenCalled();
	expect(consoleError).not.toHaveBeenCalled();
	if (preserveCell) expect(host.querySelector('[role="cell"]')).toBe(originalCell);
	return host;
}

describe('React hydration', () => {
	it('hydrates declared widgets without replacing their DOM nodes', async () => {
		const tree = (
			<FlexiBoard>
				<FlexiTarget keyName="main">
					<FlexiWidget>declared card</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		);
		const html = serverRender(tree);
		expect(html).toContain('declared card');
		const host = await hydrate(tree, html, true);
		expect(host.querySelector('[role="cell"]')?.textContent).toBe('declared card');
	});

	it('hydrates the initial layout before importing client storage and dismissing suspense', async () => {
		const loadLayout = vi.fn(() => ({
			main: [{ type: 'card', x: 0, y: 0, width: 1, height: 1, metadata: { title: 'client card' } }]
		}));
		const tree = (
			<FlexiBoard
				config={{
					registry: { card: { snippet: ({ widget }) => widget.metadata?.title } },
					initialLayout: {
						main: [
							{ type: 'card', x: 0, y: 0, width: 1, height: 1, metadata: { title: 'server card' } }
						]
					},
					loadLayout
				}}
				suspense={() => <p>loading</p>}
			>
				<FlexiTarget keyName="main" />
			</FlexiBoard>
		);
		const html = serverRender(tree);
		expect(html).toContain('server card');
		expect(html).toContain('loading');
		expect(loadLayout).not.toHaveBeenCalled();
		const host = await hydrate(tree, html);
		expect(loadLayout).toHaveBeenCalledOnce();
		expect(host.querySelector('[role="cell"]')?.textContent).toBe('client card');
		expect(host.querySelector('[data-flexi-fallback]')).toBeNull();
	});

	it('hydrates a guessed breakpoint before switching to a different viewport and stored layout', async () => {
		vi.spyOn(window, 'matchMedia').mockImplementation(
			(query) =>
				({
					matches: false,
					media: query,
					addEventListener() {},
					removeEventListener() {}
				}) as unknown as MediaQueryList
		);
		const loadLayouts = vi.fn(() => ({
			default: { main: [{ type: 'card', x: 0, y: 0, width: 1, height: 1 }] }
		}));
		const board = (label: string) => (
			<FlexiBoard
				config={{ registry: { card: { snippet: () => 'stored mobile' } } }}
				suspense={() => <p>loading</p>}
			>
				<FlexiTarget keyName="main">
					<FlexiWidget>{label}</FlexiWidget>
				</FlexiTarget>
			</FlexiBoard>
		);
		const tree = (
			<ResponsiveFlexiBoard
				config={{ breakpoints: { lg: 1024 }, ssrBreakpoint: 'lg', loadLayouts }}
				lg={board('desktop')}
			>
				{board('mobile')}
			</ResponsiveFlexiBoard>
		);
		const html = serverRender(tree);
		expect(html).toContain('desktop');
		expect(loadLayouts).not.toHaveBeenCalled();
		const host = await hydrate(tree, html);
		expect(loadLayouts).toHaveBeenCalledOnce();
		expect(host.querySelector('[role="cell"]')?.textContent).toBe('stored mobile');
		expect(host.querySelector('[data-flexi-fallback]')).toBeNull();
	});
});
