import { test, expect } from '@playwright/test';

for (const framework of ['svelte', 'react']) {
	test(`${framework} Markdown includes only its examples, inline values and props`, async ({
		request
	}) => {
		const list = await request.get(`/docs/registry/sortable-list.md?framework=${framework}`);
		expect(list.ok()).toBeTruthy();
		expect(list.headers()['content-type']).toContain('text/markdown');
		const text = await list.text();
		expect(text).toContain(framework === 'react' ? '```tsx' : '```svelte');
		expect(text).not.toContain(framework === 'react' ? '```svelte' : '```tsx');
		expect(text).toContain(framework === 'react' ? '`onReorder(ids)`' : '`onreorder(ids)`');
		expect(text).not.toContain(framework === 'react' ? '`onreorder(ids)`' : '`onReorder(ids)`');
		expect(text).not.toContain('<FrameworkText');
		const props = await (
			await request.get(`/docs/components/target.md?framework=${framework}`)
		).text();
		expect(props).toContain(framework === 'react' ? '| `keyName` |' : '| `key` |');
		expect(props).not.toContain(framework === 'react' ? '| `key` |' : '| `keyName` |');
		const ssr = await (
			await request.get(`/docs/guides/server-side-rendering.md?framework=${framework}`)
		).text();
		expect(ssr).not.toContain(framework === 'react' ? '```svelte' : '```tsx');
		const full = await (await request.get(`/llms-full.txt?framework=${framework}`)).text();
		expect(full).toContain(
			framework === 'react'
				? '# Flexiboards React documentation'
				: '# Flexiboards Svelte documentation'
		);
		if (framework === 'react') expect(full).not.toContain('# Migrating to v1.0');
	});
}

test('framework switch updates prose, table cells and copy/open/alternate Markdown URLs', async ({
	page,
	context
}) => {
	await context.addCookies([
		{ name: 'flexiboards-framework', value: 'svelte', url: 'http://localhost:4173' }
	]);
	await page.addInitScript(() => {
		localStorage.setItem('flexiboards:framework', 'svelte');
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async (text: string) => {
					(window as Window & { docsClipboard?: string }).docsClipboard = text;
				}
			}
		});
	});
	await page.goto('/docs/registry/sortable-list');
	const article = page.locator('#docs-content');
	const table = article.locator('table');
	await expect(table).toContainText('onreorder(ids)');
	await expect(table).not.toContainText('onReorder(ids)');
	await expect(page.getByRole('link', { name: /^Open Markdown/ })).toHaveAttribute(
		'href',
		/framework=svelte$/
	);
	await page
		.getByRole('button', { name: /Svelte$/ })
		.first()
		.click();
	await page.getByRole('menuitem', { name: /React/ }).click();
	await expect(table).toContainText('onReorder(ids)');
	await expect(table).not.toContainText('onreorder(ids)');
	await expect(article).toContainText('Use React keys');
	await expect(article).not.toContainText('Use keyed each blocks');
	await expect(page.getByRole('link', { name: /^Open Markdown/ })).toHaveAttribute(
		'href',
		/framework=react$/
	);
	await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
		'href',
		/framework=react$/
	);
	await page.getByRole('button', { name: 'Copy as Markdown', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
	const copied = await page.evaluate(
		() => (window as Window & { docsClipboard?: string }).docsClipboard
	);
	expect(copied).toContain('```tsx');
	expect(copied).not.toContain('```svelte');
});

test('combined URLs remain compatible and invalid or unsupported selections fail clearly', async ({
	request
}) => {
	const both = await (await request.get('/docs/registry/dashboard.md')).text();
	expect(both).toContain('```svelte');
	expect(both).toContain('```tsx');
	expect(await (await request.get('/docs/registry/dashboard.md?framework=all')).text()).toBe(both);
	expect((await request.get('/docs/registry/dashboard.md?framework=vue')).status()).toBe(400);
	expect((await request.get('/llms-full.txt?framework=vue')).status()).toBe(400);
	expect((await request.get('/docs/not-a-page.md?framework=react')).status()).toBe(404);
	expect((await request.get('/docs/breaking-changes-to-10.md?framework=react')).status()).toBe(404);
});
