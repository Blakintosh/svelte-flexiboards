import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/*
  Live React examples in the docs, the tsx twin of mdsvexamples' `svelte example`
  fences:

    ```tsx example title="1D Flow Grid"
    import { FlexiBoard } from '@flexiboards/react';
    export function FlowGrid() { ... }
    ```

  Each fence's source is written to src/lib/generated/tsx-examples/ as a real
  module (so Vite's esbuild JSX pass, svelte-check and HMR all treat it like any
  other .tsx file), and the fence is replaced by the same Example wrapper the
  Svelte fences use, mounting the module through ReactExample. The module's
  default export, or its first exported function, is the component.
*/

const RE_PARSE_META = /(\w+=\d+|\w+="[^"]*"|\w+=\[[^\]]*\]|\w+)/g;
const RE_SCRIPT_START =
	/<script(?:\s+?[a-zA-z]+(=(?:["']){0,1}[a-zA-Z0-9]+(?:["']){0,1}){0,1})*\s*?>/;

const OUT_DIR = 'src/lib/generated/tsx-examples';

/** Depth-first walk over every node of the given type (no unist dependency). */
function visit(node, type, cb) {
	if (node.type === type) cb(node);
	for (const child of node.children ?? []) visit(child, type, cb);
}

function parseMeta(meta) {
	const result = {};
	for (const part of meta.match(RE_PARSE_META) ?? []) {
		const [key, value = 'true'] = part.split('=');
		result[key] = JSON.parse(value);
	}
	return result;
}

const escape = (src) => src.replace(/`/g, '\\`').replace(/\$\{/g, '\\$\\{');
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function tsxExamples(options = {}) {
	const { Wrapper } = options;

	return function transformer(tree, file) {
		const filename = file.filename.replace(/\\/g, '/');
		const docSlug = path.basename(filename, path.extname(filename));
		let count = 0;

		visit(tree, 'code', (node) => {
			if (node.lang !== 'tsx') return;
			const meta = { lang: 'tsx', ...parseMeta(node.meta || '') };
			if (!meta.example) return;

			const code = node.value.replace(/^\s+|\s+$/g, '');
			const hash = createHash('sha1').update(filename).digest('hex').slice(0, 6);
			const moduleName = `${docSlug}-${hash}-${count++}`;
			const outDir = path.join(file.cwd, OUT_DIR);
			mkdirSync(outDir, { recursive: true });
			const outFile = path.join(outDir, `${moduleName}.tsx`);
			// Only write on change so Vite's watcher doesn't loop on its own output.
			if (!existsSync(outFile) || readFileSync(outFile, 'utf8') !== code + '\n') {
				writeFileSync(outFile, code + '\n');
			}

			node.type = 'html';
			node.value = `
<TsxExample src={String.raw\`${escape(code)}\`} meta={${escape(JSON.stringify(meta))}}>
	{#snippet example()}
		<ReactExample load={() => import('$lib/generated/tsx-examples/${moduleName}.tsx')} />
	{/snippet}
	{#snippet code()}
		{@html ${JSON.stringify(`<pre><code>${escapeHtml(code)}</code></pre>`)}}
	{/snippet}
</TsxExample>`;
			delete node.lang;
			delete node.meta;
		});

		if (!count) return;

		const scripts =
			`import TsxExample from "${Wrapper}";\n` +
			`import ReactExample from "$lib/components/docs/react-example.svelte";\n`;

		let isScript = false;
		visit(tree, 'html', (node) => {
			if (!isScript && RE_SCRIPT_START.test(node.value)) {
				isScript = true;
				node.value = node.value.replace(RE_SCRIPT_START, (script) => `${script}\n${scripts}`);
			}
		});
		if (!isScript) {
			tree.children.push({ type: 'html', value: `<script>\n${scripts}</script>` });
		}
	};
}
