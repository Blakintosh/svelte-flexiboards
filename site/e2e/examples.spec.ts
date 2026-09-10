import { test, expect } from '@playwright/test';
import { cells, frameworks, slugs, trackErrors } from './helpers';

// Every example renders a board with widgets in both adapters, without an
// uncaught error. This is the smoke test that the ports and the adapters agree.
for (const fw of frameworks) {
	for (const slug of slugs) {
		test(`${fw}: ${slug} renders`, async ({ page }) => {
			const errors = trackErrors(page);
			await page.goto(`/embed/${fw}/${slug}`);
			await expect(page.locator('[role="application"]').first()).toBeVisible();
			await expect(cells(page).first()).toBeVisible({ timeout: 10_000 });
			expect(errors).toEqual([]);
		});
	}
}
