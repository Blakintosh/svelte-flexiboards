import { test } from 'node:test';
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
