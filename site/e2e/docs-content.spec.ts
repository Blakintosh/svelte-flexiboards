import { test, expect } from '@playwright/test';
import { cells, frameworks, trackErrors } from './helpers';

for (const framework of frameworks) {
	test.describe(`${framework} documentation content`, () => {
		test.beforeEach(async ({ context, page }) => {
			await context.addCookies([
				{ name: 'flexiboards-framework', value: framework, url: 'http://localhost:4173' }
			]);
			await page.addInitScript(
				(value) => localStorage.setItem('flexiboards:framework', value),
				framework
			);
			await page.emulateMedia({ reducedMotion: 'reduce' });
		});

		test('the first board moves with the keyboard', async ({ page }) => {
			const errors = trackErrors(page);
			await page.goto('/docs/overview');
			const preview = page.locator('.preview:visible');
			await expect(cells(page, preview)).toHaveCount(2);
			const a = cells(page, preview).filter({ hasText: /^A$/ });
			const rowStepCount = Math.round((await preview.getByRole('grid').boundingBox())!.height / 40);
			await a.focus();
			await page.keyboard.press('Enter');
			for (let step = 0; step < rowStepCount; step++)
				await page.keyboard.press('ArrowDown', { delay: 25 });
			await page.keyboard.press('Enter');
			await expect(a).toHaveAttribute('aria-rowindex', '2');
			expect(errors).toEqual([]);
		});

		test('the save and restore example recovers widget positions', async ({ page }) => {
			const errors = trackErrors(page);
			await page.goto('/docs/guides/exporting-importing-boards');
			const preview = page.locator('.preview:visible');
			const a = cells(page, preview).filter({ hasText: /^A$/ });
			await expect(a).toHaveAttribute('aria-rowindex', '1');
			await preview.getByRole('button', { name: 'Save', exact: true }).click();
			const rowStepCount = Math.round((await preview.getByRole('grid').boundingBox())!.height / 40);
			await a.focus();
			await page.keyboard.press('Enter');
			for (let step = 0; step < rowStepCount; step++)
				await page.keyboard.press('ArrowDown', { delay: 25 });
			await page.keyboard.press('Enter');
			await expect(a).toHaveAttribute('aria-rowindex', '2');
			await preview.getByRole('button', { name: 'Restore', exact: true }).click();
			await expect(a).toHaveAttribute('aria-rowindex', '1');
			await expect(cells(page, preview)).toHaveCount(2);
			expect(errors).toEqual([]);
		});

		test('both transition demos respond to reduced-motion changes', async ({ page }) => {
			const errors = trackErrors(page);
			await page.goto('/docs/transitions');
			const previews = page.locator('.preview:visible');
			await expect(previews).toHaveCount(2);
			for (const preview of await previews.all()) {
				await expect(preview).toContainText('Reduced motion is on');
				await preview.scrollIntoViewIfNeeded();
				await page.evaluate(() => {
					document.documentElement.dataset.docMotion = '';
					const observer = new MutationObserver(() => {
						for (const cell of document.querySelectorAll<HTMLElement>('[data-flexi-widget]')) {
							if (
								cell.style.position === 'absolute' &&
								cell.getAttribute('aria-grabbed') !== 'true' &&
								Number.parseFloat(getComputedStyle(cell).transitionDuration) > 0
							)
								document.documentElement.dataset.docMotion = 'animated';
						}
					});
					observer.observe(document.body, {
						subtree: true,
						attributes: true,
						attributeFilter: ['style']
					});
					document.addEventListener('stop-doc-motion', () => observer.disconnect(), { once: true });
				});
				const a = cells(page, preview).filter({ hasText: /^A$/ });
				const rowStepCount = Math.round(
					(await preview.getByRole('grid').boundingBox())!.height / 40
				);
				await a.focus();
				await page.keyboard.press('Enter');
				for (let step = 0; step < rowStepCount; step++)
					await page.keyboard.press('ArrowDown', { delay: 25 });
				await page.keyboard.press('Enter');
				await expect(a).toHaveAttribute('aria-rowindex', '2');
				await expect(page.locator('[data-flexi-widget][style*="position: absolute"]')).toHaveCount(
					0
				);
				expect(
					await page.evaluate(() => {
						document.dispatchEvent(new Event('stop-doc-motion'));
						return document.documentElement.dataset.docMotion;
					})
				).toBe('');
			}
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			for (const preview of await previews.all())
				await expect(preview).toContainText('Drag A or B');
			await page.emulateMedia({ reducedMotion: 'reduce' });
			for (const preview of await previews.all())
				await expect(preview).toContainText('Reduced motion is on');
			expect(errors).toEqual([]);
		});

		test('API tables have headers and framework-correct configuration types', async ({
			page
		}, testInfo) => {
			await page.goto('/docs/components/widget');
			const tables = page.locator('#docs-content table');
			const props = tables.first();
			await expect(props.getByRole('columnheader', { name: 'Name', exact: true })).toBeVisible();
			await expect(props.getByRole('rowheader').filter({ hasText: /^id\b/ })).toContainText(
				'Optional'
			);
			await expect(tables).not.toHaveCount(0);
			const text = (await tables.allTextContents()).join('\n');
			if (framework === 'react') expect(text).not.toMatch(/Snippet<|ClassValue|<TClass>/);
			else expect(text).toContain('ClassValue');
			await props.scrollIntoViewIfNeeded();
			await page.screenshot({ path: testInfo.outputPath('api-desktop.png') });
			await page.setViewportSize({ width: 390, height: 844 });
			await expect
				.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
				.toBe(true);
			await page.screenshot({ path: testInfo.outputPath('api-mobile.png') });
		});
	});
}

test('framework-only pages hide instructions and offer a working switch', async ({
	context,
	page
}) => {
	await context.addCookies([
		{ name: 'flexiboards-framework', value: 'react', url: 'http://localhost:4173' }
	]);
	await page.addInitScript(() => localStorage.setItem('flexiboards:framework', 'react'));
	await page.goto('/docs/breaking-changes-to-10');
	await expect(page.getByRole('heading', { name: 'Renamed packages' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^Open Markdown/ })).toHaveCount(0);
	await page.getByRole('button', { name: 'Switch to Svelte', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Renamed packages' })).toBeVisible();
	await expect(page.getByRole('link', { name: /^Open Markdown/ })).toHaveAttribute(
		'href',
		/framework=svelte$/
	);
});
