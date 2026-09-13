import { test, expect } from '@playwright/test';
import index from '../src/lib/generated/llms/index.json' with { type: 'json' };
import { examplePages } from '../src/lib/example-pages';

const escapeText = (text: string) =>
	text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

for (const framework of ['svelte', 'react'] as const) {
	test(`${framework}: public routes have server-rendered metadata and working local links`, async ({
		request
	}) => {
		test.setTimeout(90_000);
		const routes = [
			{ path: '/', title: 'Flexiboards · Drag-and-drop grids for Svelte and React' },
			...index.pages
				.filter((page) => !page.frameworks || page.frameworks.includes(framework))
				.map((page) => ({
					path: `/docs/${page.slug}`,
					title: `${page.title} · Docs · Flexiboards`
				})),
			...Object.values(examplePages).map((page) => ({
				path: page.href,
				title: `${page.title} - Examples - Flexiboards`
			}))
		];
		const links = new Set<string>();
		for (const route of routes) {
			const response = await request.get(route.path, {
				headers: { cookie: `flexiboards-framework=${framework}` }
			});
			expect(response.status(), route.path).toBe(200);
			const html = await response.text();
			const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
			expect(head, route.path).toContain(`<title>${escapeText(route.title)}</title>`);
			expect(head.match(/<title>/g), route.path).toHaveLength(1);
			expect(head.match(/name="description"/g), route.path).toHaveLength(1);
			expect(head, route.path).toMatch(/name="description" content="[^"]{20,}"/);
			expect(head, route.path).toContain(`rel="canonical" href="${index.origin}${route.path}"`);
			expect(head, route.path).toContain(
				`property="og:title" content="${escapeText(route.title)}"`
			);
			for (const [, href] of html.matchAll(/href="(\/(?!\/)[^"]*)"/g)) {
				links.add(href.replaceAll('&amp;', '&').split('#')[0]);
			}
		}
		for (const link of links) {
			const response = await request.get(link, {
				headers: { cookie: `flexiboards-framework=${framework}` }
			});
			expect(response.status(), `${framework} link: ${link}`).toBe(200);
		}
	});
}

test('crawlers discover public pages and skip test boards and embedded previews', async ({
	request
}) => {
	const sitemap = await request.get('/sitemap.xml');
	expect(sitemap.status()).toBe(200);
	expect(sitemap.headers()['content-type']).toMatch(/(application|text)\/xml/);
	const xml = await sitemap.text();
	for (const page of index.pages) {
		expect(xml).toContain(`<loc>${index.origin}/docs/${page.slug}</loc>`);
	}
	expect(xml).not.toMatch(/\/(dev|embed|tests)[/<]/);
	const robots = await request.get('/robots.txt');
	expect(robots.status()).toBe(200);
	expect(await robots.text()).toContain(`Sitemap: ${index.origin}/sitemap.xml`);
	for (const path of ['/dev/accessibility-testbed', '/embed/svelte/dashboard', '/tests']) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(200);
		expect(response.headers()['x-robots-tag'], path).toBe('noindex');
	}
	for (const path of ['/docs/does-not-exist', '/examples/does-not-exist']) {
		const response = await request.get(path);
		expect(response.status(), path).toBe(404);
		expect(response.headers()['x-robots-tag'], path).toBe('noindex');
	}
});
