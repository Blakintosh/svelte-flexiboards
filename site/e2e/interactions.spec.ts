import { test, expect } from '@playwright/test';
import {
	cells,
	center,
	drag,
	expectCompact,
	frameworks,
	rowIndexes,
	settle,
	trackErrors
} from './helpers';

for (const fw of frameworks) {
	test.describe(`${fw}: numbers`, () => {
		test('moves a widget by pointer', async ({ page }) => {
			const errors = trackErrors(page);
			await page.goto(`/embed/${fw}/numbers`);
			const one = cells(page).filter({ hasText: '1' }).first();
			await expect(one).toBeVisible();
			const grid = page.locator('[role="grid"]').first();
			const box = (await grid.boundingBox())!;
			// Free 3×3 grid: drop into the top-right cell.
			await drag(page, one, { x: box.x + box.width * (5 / 6), y: box.y + box.height / 6 });
			await settle(page);
			await expect(one).toHaveAttribute('aria-colindex', '2');
			await expect(one).toHaveAttribute('aria-rowindex', '0');
			expect(errors).toEqual([]);
		});

		test('adds a widget from the keyboard', async ({ page }) => {
			await page.goto(`/embed/${fw}/numbers`);
			await expect(cells(page).first()).toBeVisible();
			const before = await cells(page).count();
			await page.getByRole('button', { name: /add a random number/i }).focus();
			await page.keyboard.press('Enter');
			// The virtual pointer starts at the adder; Shift steps it 200px, into the grid.
			await page.keyboard.press('Shift+ArrowRight', { delay: 30 });
			await page.keyboard.press('ArrowDown', { delay: 30 });
			await page.keyboard.press('Enter');
			await settle(page);
			await expect(cells(page)).toHaveCount(before + 1);
			await expect(page.locator('#flexi-portal')).toBeEmpty();
		});

		test('deletes a widget by dropping it on the deleter', async ({ page }) => {
			await page.goto(`/embed/${fw}/numbers`);
			await expect(cells(page).first()).toBeVisible();
			const before = await cells(page).count();
			const one = cells(page).filter({ hasText: '1' }).first();
			const deleter = page
				.locator('[role="region"][aria-describedby]')
				.filter({ hasText: /delete/i })
				.first();
			await drag(page, one, await center(deleter));
			await settle(page);
			await expect(cells(page)).toHaveCount(before - 1);
		});
	});

	test.describe(`${fw}: notes (nested kanban)`, () => {
		test('moving a card between columns leaves both columns compact', async ({ page }) => {
			const errors = trackErrors(page);
			await page.goto(`/embed/${fw}/notes`);
			const columns = page.locator('[role="grid"]');
			await expect(columns).toHaveCount(4);
			const doing = columns.nth(1);
			const next = columns.nth(2);
			const card = cells(page, doing).first();
			const label = (await card.textContent())!.trim();

			// Drop just below the last card of the next column.
			const nextBox = (await next.boundingBox())!;
			await drag(page, card, {
				x: nextBox.x + nextBox.width / 2,
				y: nextBox.y + nextBox.height - 10
			});
			await settle(page);

			await expect(cells(page, next).filter({ hasText: label })).toHaveCount(1);
			await expect(cells(page, doing).filter({ hasText: label })).toHaveCount(0);
			expectCompact(await rowIndexes(doing));
			expectCompact(await rowIndexes(next));
			await expect(page.locator('#flexi-portal')).toBeEmpty();
			expect(errors).toEqual([]);
		});

		test('Enter on a card grabs only the card, not the block around it', async ({ page }) => {
			await page.goto(`/embed/${fw}/notes`);
			const card = cells(page, page.locator('[role="grid"]').nth(1)).first();
			await card.focus();
			await page.keyboard.press('Enter');
			await expect(page.locator('#flexi-portal > *')).toHaveCount(1);
			await page.keyboard.press('Escape');
			await settle(page);
			await expect(page.locator('#flexi-portal')).toBeEmpty();
		});
	});
}
