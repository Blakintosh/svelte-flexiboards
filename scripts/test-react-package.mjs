import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run against an isolated npm consumer populated with the packed packages.
const cwd = resolve(process.argv[2]);
const require = createRequire(resolve(cwd, 'package.json'));
const load = (name) => import(pathToFileURL(require.resolve(name)).href);

function makeTree(React, F, mode) {
	const h = React.createElement;
	const layout = { main: [{ type: 'card', x: 0, y: 0, width: 1, height: 1 }] };
	const fromStorage = () => {
		if (typeof window === 'undefined') throw new Error('Storage callback ran on the server');
		return mode === 'responsive' ? { default: layout } : layout;
	};
	const config = { registry: { card: { snippet: () => 'stored card' } } };
	if (mode === 'stored') config.loadLayout = fromStorage;
	const board = h(
		F.FlexiBoard,
		{ config, suspense: () => h('p', null, 'loading') },
		h(F.FlexiTarget, { keyName: 'main' }, h(F.FlexiWidget, null, 'declared card'))
	);
	return mode === 'responsive'
		? h(
				F.ResponsiveFlexiBoard,
				{ config: { ssrBreakpoint: 'lg', breakpoints: { lg: 1024 }, loadLayouts: fromStorage } },
				board
			)
		: board;
}

// SSR in a separate process ensures neither DOM globals nor a previous SSR
// request can hide initialization-order bugs. Capture warnings as failures.
const html = new Map();
for (const mode of ['declared', 'stored', 'responsive']) {
	const source = `import React from 'react'; import * as F from '@flexiboards/react'; import {renderToString} from 'react-dom/server'; console.log(renderToString((${makeTree.toString()})(React,F,${JSON.stringify(mode)})));`;
	const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
		cwd,
		encoding: 'utf8'
	});
	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stderr, '', 'SSR must not warn');
	assert.match(result.stdout, /declared card/);
	html.set(mode, result.stdout.trim());
}

const { Window } = await load('happy-dom');
const win = new Window();
for (const key of [
	'window',
	'document',
	'HTMLElement',
	'Element',
	'Node',
	'navigator',
	'getComputedStyle'
]) {
	Object.defineProperty(globalThis, key, {
		configurable: true,
		value: key === 'window' ? win : key === 'getComputedStyle' ? win[key].bind(win) : win[key]
	});
}
window.matchMedia = (media) => ({
	media,
	matches: false,
	addEventListener() {},
	removeEventListener() {}
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await load('react');
const { hydrateRoot } = await load('react-dom/client');
const act = React.act ?? (await load('react-dom/test-utils')).act;
const F = await load('@flexiboards/react');
(await load('@flexiboards/testing')).installResizeObserver();

for (const [mode, markup] of html) {
	const host = document.createElement('div');
	document.body.appendChild(host);
	host.innerHTML = markup;
	const originalCell = host.querySelector('[role="cell"]');
	const errors = [];
	const originalError = console.error;
	console.error = (...args) => errors.push(args);
	let root;
	try {
		await act(async () => {
			root = hydrateRoot(host, makeTree(React, F, mode), {
				onRecoverableError: (error) => errors.push(error)
			});
		});
		assert.deepEqual(errors, [], 'Hydration must not warn or recover by replacing the tree');
		assert.equal(
			host.querySelector('[role="cell"]').textContent,
			mode === 'declared' ? 'declared card' : 'stored card'
		);
		if (mode === 'declared') assert.equal(host.querySelector('[role="cell"]'), originalCell);
		assert.equal(host.querySelector('[data-flexi-fallback]'), null);
	} finally {
		if (root) await act(async () => root.unmount());
		await new Promise((done) => setTimeout(done, 10));
		console.error = originalError;
		host.remove();
	}
}
await win.happyDOM.abort();
console.log(
	`Packed React ${React.version}: SSR and hydration passed for declared, stored, and responsive layouts`
);
