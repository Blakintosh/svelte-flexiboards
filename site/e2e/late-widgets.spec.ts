import { expect, test } from '@playwright/test';
import { cells, frameworks, trackErrors } from './helpers';

for (const framework of frameworks) {
	test(`${framework}: the widget docs add declarations to an already mounted list`, async ({
		page,
		context
	}) => {
		const errors = trackErrors(page);
		await context.addCookies([
			{ name: 'flexiboards-framework', value: framework, url: 'http://localhost:4173' }
		]);
		await page.addInitScript((fw) => localStorage.setItem('flexiboards:framework', fw), framework);
		await page.goto('/docs/components/widget');
		const preview = page.locator('.preview:visible');
		await expect(cells(page, preview)).toHaveCount(1);
		await preview.getByRole('button', { name: 'Add note', exact: true }).click();
		await expect(cells(page, preview)).toHaveCount(2);
		await preview.getByRole('button', { name: 'Add note', exact: true }).click();
		await expect(cells(page, preview)).toHaveCount(3);
		await expect(cells(page, preview).last()).toHaveText('Note 3');
		expect(errors).toEqual([]);
	});
}
