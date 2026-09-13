import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { transform } from './build-llms-docs.mjs';

const render = (source, framework) => transform(source, { slug: 'test', framework });

test('framework gates filter prose, headings and examples, including nested gates', () => {
	const source = [
		'Shared.',
		'<Only svelte react>',
		'<Only svelte>',
		'## Svelte heading',
		'```svelte',
		'<Only react>',
		'literal code, not a gate',
		'</Only>',
		'```',
		'</Only>',
		'<Only react>',
		'## React heading',
		'```tsx',
		'<Widget />',
		'```',
		'</Only>',
		'</Only>'
	].join('\n');
	const svelte = render(source, 'svelte').text;
	assert.match(svelte, /Shared\./);
	assert.match(svelte, /Svelte heading/);
	assert.match(svelte, /<Only react>/);
	assert.doesNotMatch(svelte, /React heading|```tsx/);
	const react = render(source, 'react').text;
	assert.match(react, /React heading/);
	assert.doesNotMatch(react, /Svelte heading|literal code|```svelte/);
	assert.match(render(source, 'all').text, /\*\*Svelte\*\*/);
	assert.match(render(source, 'all').text, /\*\*React\*\*/);
});

test('inline alternatives work in prose, standalone, and table cells without touching code', () => {
	const source = [
		'Use <FrameworkText svelte="class" react="className" code />.',
		'| <FrameworkText svelte="key" react="keyName" code /> | Key |',
		'<FrameworkText svelte="snippet" react="render function" />',
		'```html',
		'<FrameworkText svelte="literal" react="also literal" />',
		'```'
	].join('\n');
	assert.match(render(source, 'react').text, /Use `className`\./);
	assert.match(render(source, 'react').text, /\| `keyName` \| Key \|/);
	assert.match(render(source, 'svelte').text, /\nsnippet\n/);
	assert.match(render(source, 'react').text, /<FrameworkText svelte="literal"/);
	assert.match(render(source, 'all').text, /`class` \(Svelte\) \/ `className` \(React\)/);
});

test('API aliases and shorthand select the right component and framework tables', () => {
	const source = [
		'<script>',
		"import api from '$lib/generated/api/flexi-target.json';",
		"import dashboard from '$lib/generated/api/flexi-dashboard.json';",
		'</script>',
		'<ApiProps {api} />',
		'<ApiProps api={dashboard} />'
	].join('\n');
	const react = render(source, 'react');
	assert.deepEqual(react.unhandled, []);
	assert.match(react.text, /\| `keyName` \|/);
	assert.doesNotMatch(react.text, /\| `key` \||\(bindable\)/);
	assert.match(react.text, /\| `columns` \|/);
	assert.match(render(source, 'svelte').text, /\| `key` \|/);
});

test('malformed gates fail generation instead of silently leaking or dropping content', () => {
	assert.throws(() => render('<Only react>\nMissing close', 'svelte'), /Unclosed/);
	assert.throws(() => render('</Only>', 'react'), /Unmatched/);
});

test('unsupported prose directives and inline framework gates fail, while code stays literal', () => {
	for (const framework of ['svelte', 'react', 'all']) {
		assert.throws(() => render('<Only react>React-only prose</Only>', framework), /separate lines/);
		assert.throws(
			() => render('{#if api.controller.methods.length}\nMethods\n{/if}', framework),
			/Unsupported Svelte directive/
		);
		assert.match(
			render('```svelte\n{#if ready}<Only react>Literal</Only>{/if}\n```', framework).text,
			/\{#if ready\}/
		);
	}
});

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readDoc = (slug) =>
	fs.readFileSync(path.join(siteRoot, 'src/content/docs', `${slug}.md`), 'utf8');

test('authored widget reference exports its actual methods without template fallbacks', () => {
	for (const framework of ['svelte', 'react', 'all']) {
		const result = render(readDoc('components/widget'), framework);
		assert.deepEqual(result.unhandled, []);
		assert.match(result.text, /`delete`/);
		assert.match(result.text, /`moveTo`/);
		assert.doesNotMatch(result.text, /does not expose any methods|\{[#:/](?:if|else)/);
	}
});

test('configuration and controller references select adapter types, including combined output', () => {
	const source = readDoc('components/widget');
	const react = render(source, 'react').text;
	const svelte = render(source, 'svelte').text;
	assert.doesNotMatch(react, /Snippet<|ClassValue|<TClass>|\bCoreFlexi/);
	assert.match(react, /ReactNode/);
	assert.match(svelte, /Snippet</);
	assert.match(svelte, /ClassValue/);
	assert.match(render(source, 'all').text, /Properties \(React\)/);
	assert.match(render(source, 'all').text, /Properties \(Svelte\)/);
});

test('generated public types are valid syntax and preserve optionality and envelope loading', () => {
	const root = path.join(siteRoot, 'src/lib/generated/api');
	for (const name of fs.readdirSync(root).filter((name) => name.endsWith('.json'))) {
		const api = JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
		const rows = [
			api.props,
			api.propsReact,
			...Object.values(api.types),
			...Object.values(api.typesReact),
			api.controller?.properties,
			api.controller?.methods,
			api.controllerReact?.properties,
			api.controllerReact?.methods
		]
			.filter(Boolean)
			.flat();
		for (const row of rows) {
			const { diagnostics } = ts.transpileModule(`type Entry = ${row.type};`, {
				reportDiagnostics: true,
				compilerOptions: { target: ts.ScriptTarget.ESNext }
			});
			assert.deepEqual(
				diagnostics?.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')),
				[],
				`${name}: ${row.name}: ${row.type}`
			);
		}
		for (const rows of [
			api.props,
			api.propsReact,
			...Object.values(api.types),
			...Object.values(api.typesReact)
		]) {
			for (const row of rows)
				assert.equal(typeof row.optional, 'boolean', `${name}: ${row.name} optionality`);
		}
	}
	const board = JSON.parse(fs.readFileSync(path.join(root, 'flexi-board.json'), 'utf8'));
	assert.match(
		board.types.FlexiBoardConfiguration.find((row) => row.name === 'loadLayout').type,
		/FlexiLayoutEnvelope/
	);
	const widget = JSON.parse(fs.readFileSync(path.join(root, 'flexi-widget.json'), 'utf8'));
	assert.equal(
		widget.props.some((row) => ['className', 'snippet'].includes(row.name)),
		false
	);
});

test('every authored page transforms for both frameworks without unhandled content', () => {
	const root = path.join(siteRoot, 'src/content/docs');
	for (const file of fs
		.readdirSync(root, { recursive: true })
		.filter((name) => name.endsWith('.md'))) {
		for (const framework of ['svelte', 'react', 'all']) {
			const result = transform(fs.readFileSync(path.join(root, file), 'utf8'), {
				slug: file,
				framework
			});
			assert.deepEqual(result.unhandled, [], `${file}: ${framework}`);
		}
	}
});

test('authored code listings parse in their declared language', async () => {
	const { compile } = await import('svelte/compiler');
	const root = path.join(siteRoot, 'src/content/docs');
	for (const file of fs
		.readdirSync(root, { recursive: true })
		.filter((name) => name.endsWith('.md'))) {
		const source = fs.readFileSync(path.join(root, file), 'utf8');
		for (const match of source.matchAll(/^```(\w+)[^\n]*\n([\s\S]*?)^```/gm)) {
			const [, lang, code] = match;
			const label = `${file}:${source.slice(0, match.index).split('\n').length}`;
			if (lang === 'svelte') compile(code, { generate: 'server', filename: `${label}.svelte` });
			else if (lang === 'json') assert.doesNotThrow(() => JSON.parse(code), label);
			else if (['ts', 'typescript', 'tsx', 'js', 'javascript', 'jsx'].includes(lang)) {
				const { diagnostics } = ts.transpileModule(code, {
					fileName: `${label}.${lang === 'jsx' || lang === 'tsx' ? 'tsx' : 'ts'}`,
					reportDiagnostics: true,
					compilerOptions: { target: ts.ScriptTarget.ESNext, jsx: ts.JsxEmit.ReactJSX }
				});
				assert.deepEqual(
					diagnostics?.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')),
					[],
					label
				);
			}
		}
	}
});
