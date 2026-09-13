import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const cwd = resolve(process.argv[2]);
const require = createRequire(resolve(cwd, 'package.json'));
const { build } = require('esbuild');
const { compile, compileModule, VERSION } = require('svelte/compiler');
writeFileSync(
	resolve(cwd, 'Board.svelte'),
	`
<script>
import { FlexiBoard, FlexiTarget, FlexiWidget, LAYOUT_FORMAT_VERSION, cssTransitionConfig } from '@flexiboards/svelte';
import * as motion from '@flexiboards/svelte/motion';
if (LAYOUT_FORMAT_VERSION !== 1 || typeof cssTransitionConfig !== 'function' || typeof motion.spring !== 'function') throw new Error('Missing documented export');
</script>
<FlexiBoard><FlexiTarget key="main"><FlexiWidget x={0} y={0}>Packed card</FlexiWidget></FlexiTarget></FlexiBoard>
`
);
for (const generate of ['server', 'client']) {
	await build({
		stdin: {
			contents:
				generate === 'server'
					? "import {render} from 'svelte/server'; import Board from './Board.svelte'; console.log(JSON.stringify(render(Board).body));"
					: "export {hydrate, unmount, flushSync} from 'svelte'; export {default as Board} from './Board.svelte';",
			resolveDir: cwd,
			sourcefile: `${generate}-entry.js`
		},
		outfile: resolve(cwd, `${generate}.mjs`),
		bundle: true,
		platform: 'node',
		format: 'esm',
		conditions: generate === 'client' ? ['browser'] : [],
		external: ['svelte', 'svelte/*', '@flexiboards/core', '@flexiboards/testing'],
		plugins: [
			{
				name: 'svelte-consumer',
				setup(builder) {
					builder.onLoad({ filter: /\.svelte$/ }, ({ path }) => ({
						contents: compile(readFileSync(path, 'utf8'), { filename: path, generate }).js.code,
						loader: 'js'
					}));
					builder.onLoad({ filter: /\.svelte\.js$/ }, ({ path }) => ({
						contents: compileModule(readFileSync(path, 'utf8'), { filename: path, generate }).js
							.code,
						loader: 'js'
					}));
				}
			}
		]
	});
}
const server = spawnSync(process.execPath, ['server.mjs'], { cwd, encoding: 'utf8' });
assert.equal(server.status, 0, server.stderr);
assert.equal(server.stderr, '', 'SSR must not warn');
const html = JSON.parse(server.stdout);
assert.match(html, /Packed card/);
assert.match(html, /role="gridcell"/);
writeFileSync(
	resolve(cwd, 'hydrate.mjs'),
	`
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
const win = new Window();
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Text', 'Comment', 'navigator', 'getComputedStyle']) {
 Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? win : key === 'getComputedStyle' ? win[key].bind(win) : win[key] });
}
const { installResizeObserver, layoutGrid, cellAt } = await import('@flexiboards/testing');
installResizeObserver();
const { hydrate, unmount, flushSync, Board } = await import('./client.mjs');
document.body.innerHTML = ${JSON.stringify(html)};
const original = document.querySelector('[data-flexi-widget]');
const originalId = original.id;
const warnings = [];
const warn = console.warn;
console.warn = (...args) => warnings.push(args);
const app = hydrate(Board, { target: document.body });
flushSync();
assert.deepEqual(warnings, [], 'Hydration must not warn');
assert.equal(document.querySelector('[data-flexi-widget]'), original);
assert.equal(original.id, originalId, 'Hydration must preserve ownership IDs');
assert.equal(original.getAttribute('aria-colindex'), '1');
assert.equal(document.querySelector('[role="row"]').getAttribute('aria-owns'), originalId);
const restore = layoutGrid();
assert.equal(cellAt(0, 0), original);
assert.equal(original.getBoundingClientRect().left, 0);
restore();
await unmount(app);
console.warn = warn;
await win.happyDOM.abort();
`
);
const client = spawnSync(process.execPath, ['--conditions=browser', 'hydrate.mjs'], {
	cwd,
	encoding: 'utf8'
});
assert.equal(client.status, 0, client.stderr);
assert.equal(client.stderr, '', 'Hydration must not log errors');
console.log(
	`Packed Svelte ${VERSION}: documented exports, SSR, hydration identity and testing helpers passed`
);
