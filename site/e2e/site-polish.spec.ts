import { expect, test } from '@playwright/test';
import { cells, center, drag, frameworks, trackErrors } from './helpers';

for (const framework of frameworks) {
	test(`${framework} iframe waits for client rendering and resets when changing examples`, async ({
		page,
		context
	}, testInfo) => {
		const errors = trackErrors(page);
		await context.addCookies([
			{ name: 'flexiboards-framework', value: framework, url: 'http://localhost:4173' }
		]);
		await page.addInitScript(
			(value) => localStorage.setItem('flexiboards:framework', value),
			framework
		);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		let requested = false;
		let release!: () => void;
		const pending = new Promise<void>((resolve) => {
			release = resolve;
		});
		await page.route('**/_app/immutable/**/*.js', async (route) => {
			if (!requested && route.request().frame() !== page.mainFrame()) {
				requested = true;
				await pending;
			}
			await route.continue();
		});
		await page.goto('/examples/dashboard', { waitUntil: 'domcontentloaded' });
		const iframe = page.locator('iframe');
		try {
			await expect.poll(() => requested).toBe(true);
			await expect(page.getByRole('status')).toHaveText('Loading dashboard example…');
			await expect(iframe).toHaveAttribute('inert', '');
			await testInfo.attach('iframe-loading', {
				body: await page.screenshot(),
				contentType: 'image/png'
			});
		} finally {
			release();
		}
		await expect(iframe).toBeVisible();
		await expect(page.getByRole('status')).toHaveCount(0);
		await expect(page.frameLocator('iframe').getByRole('grid').first()).toBeVisible();
		await page.getByRole('link', { name: 'Numbers', exact: true }).click();
		await expect(iframe).toHaveAttribute('src', `/embed/${framework}/numbers`);
		await expect(iframe).toBeVisible();
		await expect(page.frameLocator('iframe').getByRole('grid').first()).toBeVisible();
		expect(errors).toEqual([]);
	});

	test(`${framework} registry board cards keep their height between targets`, async ({
		page,
		context
	}) => {
		await context.addCookies([
			{ name: 'flexiboards-framework', value: framework, url: 'http://localhost:4173' }
		]);
		await page.addInitScript(
			(value) => localStorage.setItem('flexiboards:framework', value),
			framework
		);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/docs/registry/board');
		const preview = page.locator('.preview:visible');
		const grids = preview.getByRole('grid');
		const original = cells(page, grids.first()).filter({ hasText: 'Write the docs' });
		await expect(original).toBeVisible();
		await preview.scrollIntoViewIfNeeded();
		const before = (await original.boundingBox())!.height;
		await drag(
			page,
			original.getByRole('button', { name: 'Move write the docs' }),
			await center(grids.nth(1))
		);
		const moved = cells(page, grids.nth(1)).filter({ hasText: 'Write the docs' });
		await expect(moved).toBeVisible();
		await expect.poll(async () => (await moved.boundingBox())!.height).toBeCloseTo(before, 0);
		await expect
			.poll(
				async () =>
					(await cells(page, grids.nth(1)).filter({ hasText: 'Record the demo' }).boundingBox())!
						.height
			)
			.toBeCloseTo(before, 0);
	});
}

test('a stalled iframe offers a retry that loads a fresh document', async ({ page }) => {
	await page.clock.install();
	await page.route('**/embed/svelte/dashboard', async (route) => {
		await route.fulfill({
			contentType: 'text/html',
			body: '<!doctype html><title>Unavailable example</title>'
		});
	});
	await page.goto('/examples/dashboard');
	await expect(page.getByRole('status')).toHaveText('Loading dashboard example…');
	await page.clock.fastForward(16_000);
	await expect(page.getByText('This example is taking longer to load.')).toBeVisible();
	await page.unroute('**/embed/svelte/dashboard');
	await page.getByRole('button', { name: 'Retry example' }).click();
	await page.clock.resume();
	await expect(page.locator('iframe')).toBeVisible();
	await expect(page.frameLocator('iframe').getByRole('grid').first()).toBeVisible();
});

test('framework and theme menus support keyboard selection and return focus', async ({ page }) => {
	await page.goto('/');
	const framework = page.locator('header').getByRole('button', { name: 'Svelte', exact: true });
	await framework.focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('menuitemradio', { name: 'Svelte', exact: true })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(
		page.locator('header').getByRole('button', { name: 'React', exact: true })
	).toBeFocused();
	const theme = page
		.getByRole('button', { name: 'Toggle theme', exact: true })
		.filter({ visible: true });
	await theme.click();
	await page.getByRole('menuitemradio', { name: 'Dark', exact: true }).click();
	await expect(page.locator('html')).toHaveClass(/dark/);
	await expect(theme).toBeFocused();
	await theme.press('Enter');
	await expect(page.getByRole('menuitemradio', { name: 'Dark', exact: true })).toHaveAttribute(
		'aria-checked',
		'true'
	);
	await page.keyboard.press('Escape');
	await expect(theme).toBeFocused();
	await expect(page.getByRole('menu')).toHaveCount(0);
});
