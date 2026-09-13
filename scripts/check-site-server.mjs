import assert from 'node:assert/strict';

const origin = process.argv[2];
assert(origin, 'Usage: node scripts/check-site-server.mjs http://localhost:3000');
const get = (path, headers = {}) =>
	fetch(new URL(path, origin), { headers, signal: AbortSignal.timeout(15_000) });

for (const framework of ['svelte', 'react']) {
	const response = await get('/docs/overview', { cookie: `flexiboards-framework=${framework}` });
	assert.equal(response.status, 200, `${framework} docs`);
	assert((await response.text()).includes('<title>Overview · Docs · Flexiboards</title>'));
	const markdown = await get(`/docs/overview.md?framework=${framework}`);
	assert.equal(markdown.status, 200);
	assert((await markdown.text()).includes(`@flexiboards/${framework}`));
	const registry = await get(`/r/${framework}/flexi-board.json`);
	assert.equal(registry.status, 200);
	const item = await registry.json();
	assert(item.dependencies.includes(`@flexiboards/${framework}`));
	assert(item.files.every((file) => file.content.length > 0));
}

for (const [path, contentType, text] of [
	['/healthz', /^text\/plain\b/, 'ok'],
	['/llms.txt', /^text\/(markdown|plain)\b/, 'Flexiboards'],
	['/sitemap.xml', /^(application|text)\/xml\b/, '/docs/overview'],
	['/robots.txt', /^text\/plain\b/, '/sitemap.xml']
]) {
	const response = await get(path);
	assert.equal(response.status, 200, path);
	assert(contentType.test(response.headers.get('content-type') ?? ''), `${path}: content type`);
	assert((await response.text()).includes(text), `${path}: content`);
}

console.log('Production server: health, SSR, Markdown, registry and discovery routes passed.');
