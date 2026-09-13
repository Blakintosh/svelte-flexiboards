import { test, expect } from '@playwright/test';
import { cells, center, expectCompact, frameworks, rowIndexes, trackErrors } from './helpers';

for (const framework of frameworks) {
	test(`${framework}: nested columns use the destination card size during the drop`, async ({
		page
	}) => {
		const errors = trackErrors(page);
		await page.clock.install();
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto(`/embed/${framework}/notes`);
		const grids = page.getByRole('grid');
		await expect(grids).toHaveCount(4);
		const source = grids.nth(1);
		const destination = grids.nth(2);
		await source.evaluate((grid) => (grid.style.width = '100px'));
		await destination.evaluate((grid) => (grid.style.width = '320px'));
		const card = cells(page, source).first();
		const label = (await card.textContent())!.trim();
		const oldHeight = (await card.boundingBox())!.height;
		const start = await center(card);
		const end = await center(destination);
		await page.mouse.move(start.x, start.y);
		await page.mouse.down();
		await page.mouse.move(end.x, end.y, { steps: 12 });
		await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
		await page.mouse.up();
		await page.clock.runFor(32);

		const flying = cells(page, destination).filter({ hasText: label });
		await expect(flying).toHaveCSS('position', 'absolute');
		const row = Number(await flying.getAttribute('aria-rowindex')) + 1;
		const placeholders = destination.locator('div[style*="visibility: hidden"]');
		const index = await placeholders.evaluateAll(
			(nodes, row) =>
				nodes.findIndex((node) => getComputedStyle(node).gridRowStart === String(row)),
			row
		);
		expect(index).toBeGreaterThanOrEqual(0);
		const placeholder = placeholders.nth(index);
		const during = await placeholder.evaluate((node) => {
			const box = node.getBoundingClientRect();
			return { width: box.width, height: box.height };
		});
		const gridDuring = (await destination.boundingBox())!;
		expectCompact(await rowIndexes(source));
		expectCompact(await rowIndexes(destination));

		await page.clock.runFor(1500);
		await expect(flying).not.toHaveCSS('position', 'absolute');
		const final = (await flying.boundingBox())!;
		expect(final.height).toBeLessThan(oldHeight - 10);
		expect(during.height).toBeCloseTo(final.height, 0);
		expect(during.width).toBeCloseTo(final.width, 0);
		expect(gridDuring.height).toBeCloseTo((await destination.boundingBox())!.height, 0);
		await expect(placeholders).toHaveCount(0);
		expect(errors).toEqual([]);
	});

	test(`${framework}: a card can be grabbed again before its drop settles`, async ({ page }) => {
		const errors = trackErrors(page);
		await page.clock.install();
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.goto(`/embed/${framework}/notes`);
		const grids = page.getByRole('grid');
		await expect(grids).toHaveCount(4);
		const source = grids.nth(1);
		const destination = grids.nth(2);
		const card = cells(page, source).first();
		const label = (await card.textContent())!.trim();
		const originalCount = await cells(page).count();
		const start = await center(card);
		const end = await center(destination);
		await page.mouse.move(start.x, start.y);
		await page.mouse.down();
		await page.mouse.move(end.x, end.y, { steps: 12 });
		await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
		await page.mouse.up();
		await page.clock.runFor(32);
		const flying = cells(page, destination).filter({ hasText: label });
		await expect(flying).toHaveCSS('position', 'absolute');

		const midFlight = await center(flying);
		await page.mouse.move(midFlight.x, midFlight.y);
		await page.mouse.down();
		await expect(
			page.locator('[role="cell"][aria-grabbed="true"]').filter({ hasText: label })
		).toHaveCount(1);
		const back = await center(source);
		await page.mouse.move(back.x, back.y, { steps: 12 });
		await page.mouse.up();
		await page.clock.runFor(1500);

		await expect(cells(page, source).filter({ hasText: label })).toHaveCount(1);
		await expect(cells(page, destination).filter({ hasText: label })).toHaveCount(0);
		await expect(cells(page)).toHaveCount(originalCount);
		expectCompact(await rowIndexes(source));
		expectCompact(await rowIndexes(destination));
		await expect(page.locator('div[style*="visibility: hidden"]')).toHaveCount(0);
		expect(errors).toEqual([]);
	});
}
