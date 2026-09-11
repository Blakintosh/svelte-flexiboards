import { test, expect } from '@playwright/test';
import { cells, center, drag, frameworks, trackErrors } from './helpers';

for (const framework of frameworks) {
	test.describe(`${framework} registry`, () => {
		test.beforeEach(async ({ context, page }) => {
			await page.setViewportSize({ width: 1440, height: 1000 });
			await context.addCookies([
				{ name: 'flexiboards-framework', value: framework, url: 'http://localhost:4173' }
			]);
			await page.addInitScript(
				(fw) => localStorage.setItem('flexiboards:framework', fw),
				framework
			);
		});

		test('dashboard renders custom content and supports resize and keyboard cancellation', async ({
			page
		}) => {
			const errors = trackErrors(page);
			await page.goto('/docs/registry/dashboard');
			const preview = page.locator('.preview:visible');
			await preview.evaluate((el) => el.scrollIntoView({ block: 'center' }));
			await expect(cells(page, preview)).toHaveCount(2);
			const grabber = preview.getByRole('button', { name: 'Move revenue', exact: true });
			await expect(grabber).toBeEnabled();
			await expect(grabber).toHaveCSS('width', '32px');
			await grabber.focus();
			await page.keyboard.press('Enter');
			await expect(page.locator('[aria-grabbed="true"]')).not.toHaveCount(0);
			await page.keyboard.press('Escape');
			await expect(page.locator('[aria-grabbed="true"]')).toHaveCount(0);
			const tile = cells(page, preview).filter({ hasText: '$24,560' });
			const resize = preview.getByRole('button', { name: 'Resize revenue', exact: true });
			await expect(resize).toHaveCSS('position', 'absolute');
			await preview.evaluate((el) => el.scrollIntoView({ block: 'center' }));
			const start = await center(resize);
			await drag(page, resize, { x: start.x, y: start.y + 176 });
			await expect(tile).toHaveAttribute('aria-rowspan', '2');
			expect(errors).toEqual([]);
		});

		test('sortable composition reports the new order', async ({ page }) => {
			const errors = trackErrors(page);
			await page.goto('/docs/registry/sortable-list');
			const preview = page.locator('.preview:visible');
			await expect(cells(page, preview)).toHaveCount(3);
			const first = preview.getByRole('button', { name: 'Move Research', exact: true });
			await preview.evaluate((el) => el.scrollIntoView({ block: 'center' }));
			const last = preview.getByRole('button', { name: 'Move Release', exact: true });
			await expect(first).toBeEnabled();
			await drag(page, first, await center(last));
			await expect(preview.getByText(/^Order:/)).not.toHaveText(
				'Order: research, prototype, release'
			);
			await expect(preview.getByText(/^Order:/)).toContainText('research');
			expect(errors).toEqual([]);
		});

		test('generic board moves an item between targets', async ({ page }) => {
			const errors = trackErrors(page);
			await page.goto('/docs/registry/board');
			const preview = page.locator('.preview:visible');
			const grids = preview.getByRole('grid');
			await expect(grids).toHaveCount(2);
			await expect(cells(page, grids.nth(0))).toHaveCount(1);
			const handle = preview.getByRole('button', { name: 'Move write the docs', exact: true });
			await preview.evaluate((el) => el.scrollIntoView({ block: 'center' }));
			await expect(handle).toBeEnabled();
			await drag(page, handle, await center(grids.nth(1)));
			await expect(cells(page, grids.nth(0))).toHaveCount(0);
			await expect(cells(page, grids.nth(1))).toHaveCount(2);
			expect(errors).toEqual([]);
		});

		for (const slug of ['grabber', 'resizer']) {
			test(`${slug} is available independently`, async ({ page, request }) => {
				const errors = trackErrors(page);
				await page.goto(`/docs/registry/${slug}`);
				await expect(
					page
						.locator('.preview:visible')
						.getByRole('button', { name: `${slug === 'grabber' ? 'Move' : 'Resize'} notes` })
				).toBeEnabled();
				const response = await request.get(`/r/${framework}/flexi-${slug}.json`);
				expect(response.ok()).toBeTruthy();
				const item = await response.json();
				expect(item.type).toBe('registry:component');
				expect(item.files).toHaveLength(1);
				expect(item.files[0].content).toContain('sr-only');
				expect(errors).toEqual([]);
			});
		}
	});
}

test('contents scroll independently at the top of a long article', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 800 });
	await page.goto('/docs/registry/dashboard');
	const contents = page.locator('[data-docs-scroll="contents"]');
	const before = await page.evaluate(() => window.scrollY);
	await contents.hover();
	await page.mouse.wheel(0, 1600);
	await expect.poll(() => contents.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
	await expect(contents.getByRole('link', { name: 'FlexiDelete', exact: true })).toBeInViewport();
	expect(await page.evaluate(() => window.scrollY)).toBe(before);
	await page.getByRole('heading', { name: 'Saving layouts', exact: true }).scrollIntoViewIfNeeded();
	const box = await contents.boundingBox();
	expect(box?.y).toBeGreaterThanOrEqual(59);
	expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(801);
});

test('registry payloads include complete component families and Svelte install targets', async ({
	request
}) => {
	for (const framework of frameworks) {
		const index = await (await request.get(`/r/${framework}/registry.json`)).json();
		expect(index.items.map((item: { name: string }) => item.name)).toEqual([
			'flexi-grabber',
			'flexi-resizer',
			'flexi-handles',
			'flexi-sortable-list',
			'flexi-dashboard',
			'flexi-board'
		]);
		for (const entry of index.items) {
			const item = await (await request.get(`/r/${framework}/${entry.name}.json`)).json();
			expect(item.type).toBe('registry:component');
			if (['flexi-dashboard', 'flexi-sortable-list', 'flexi-board'].includes(item.name)) {
				expect(
					item.files.some((file: { path: string }) => file.path.endsWith(`${item.name}/index.ts`))
				).toBeTruthy();
			}
			for (const file of item.files) {
				expect(file.content.length).toBeGreaterThan(0);
				if (framework === 'svelte')
					expect(file.target).toBe(file.path.replace('lib/components/', ''));
			}
		}
	}
});
