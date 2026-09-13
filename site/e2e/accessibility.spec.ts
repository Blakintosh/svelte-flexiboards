import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { frameworks, cells, trackErrors } from './helpers';

async function expectAccessible(page: Page) {
	// axe counts aria-owned cells twice: https://github.com/dequelabs/axe-core/issues/4048.
	// Check the browser's actual parent/child relationships for these grids instead.
	const session = await page.context().newCDPSession(page);
	try {
		const { nodes } = await session.send('Accessibility.getFullAXTree');
		const byId = new Map(nodes.map((node) => [node.nodeId, node]));
		for (const node of nodes.filter((node) => !node.ignored && node.role?.value === 'gridcell')) {
			let parent = byId.get(node.parentId!);
			while (parent?.ignored) parent = byId.get(parent.parentId!);
			expect(parent?.role?.value).toBe('row');
		}
		for (const node of nodes.filter((node) => !node.ignored && node.role?.value === 'grid')) {
			const children = (node.childIds ?? [])
				.map((id) => byId.get(id))
				.filter((child) => !child?.ignored);
			expect(children.length).toBeGreaterThan(0);
			expect(children.every((child) => child?.role?.value === 'row')).toBe(true);
		}
	} finally {
		await session.detach();
	}
	const result = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
		.analyze();
	expect(
		result.violations
			.map(({ id, nodes }) => ({
				id,
				nodes: nodes.filter(
					(node) =>
						!(
							id === 'aria-required-children' &&
							node.html.includes('data-flexi-grid=') &&
							node.any.every(
								(check) =>
									check.data?.messageKey === 'unallowed' && check.data?.values === '[role=gridcell]'
							)
						)
				)
			}))
			.filter(({ nodes }) => nodes.length)
			.map(({ id, nodes }) => ({
				id,
				targets: nodes.map((node) => ({ target: node.target, message: node.failureSummary }))
			}))
	).toEqual([]);
}

for (const framework of frameworks) {
	test.describe(`${framework}: accessibility`, () => {
		test.beforeEach(async ({ page }) => {
			await page.goto(`/dev/accessibility-testbed?framework=${framework}`);
			await expect(page.getByRole('button', { name: 'Move card', exact: true })).toBeEnabled();
		});

		test('exposes rows and cells in the browser accessibility tree', async ({ page }) => {
			await expectAccessible(page);
			const grid = page.getByRole('grid').first();
			const tree = await grid.ariaSnapshot();
			expect(tree).toMatch(/row(?: "[^"]*")?:\n\s+- gridcell/);
			expect(tree).toContain('button "Move card"');
			await expect(grid.getByRole('row')).toHaveCount(2);
			await expect(grid.getByRole('gridcell')).toHaveCount(3);
			await expect(grid.getByRole('gridcell').first()).toHaveAttribute('aria-colindex', '1');
			await expect(page.getByRole('button', { name: 'Disabled move' })).toBeDisabled();
		});

		test('keyboard move, cancel and resize retain focus and announce the action', async ({
			page
		}) => {
			const errors = trackErrors(page);
			const move = page.getByRole('button', { name: 'Move card', exact: true });
			const live = page.getByRole('region', { name: 'Drag-and-drop announcer' });
			await move.focus();
			await page.keyboard.press('Enter');
			await expect(live).toContainText('Grabbed widget at column 1, row 1');
			await expect(move).toBeFocused();
			await page.keyboard.press('Tab');
			await expect(move).toBeFocused();
			await expect(page.locator('[aria-label="Widget action preview"]')).toHaveAttribute(
				'inert',
				''
			);
			await expectAccessible(page);
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Escape');
			await expect(live).toContainText('Cancelled');
			await expect(move).toBeFocused();
			await expect(cells(page).filter({ has: move })).toHaveAttribute('aria-rowindex', '1');
			await page.keyboard.press('Tab');
			const resize = page.getByRole('button', { name: 'Resize card', exact: true });
			await expect(resize).toBeFocused();
			await page.keyboard.press('Enter');
			await expect(live).toContainText('Resizing widget');
			for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
			await page.keyboard.press('Enter');
			await expect(resize).toBeFocused();
			await expect(cells(page).filter({ has: resize })).toHaveAttribute('aria-rowspan', '2');
			await expectAccessible(page);
			expect(errors).toEqual([]);
		});

		test('nested button activation does not grab its widget', async ({ page }) => {
			const button = page.getByRole('button', { name: 'Card action' });
			await button.focus();
			await page.keyboard.press('Enter');
			await expect(page.locator('#flexi-portal')).toBeEmpty();
			await expect(button).toBeFocused();
		});

		test('keyboard drop across targets restores focus to the moved handle', async ({ page }) => {
			const move = page.getByRole('button', { name: 'Move card', exact: true });
			await move.focus();
			await page.keyboard.press('Enter');
			for (let i = 0; i < 18; i++) await page.keyboard.press('ArrowRight');
			await page.keyboard.press('Enter');
			await expect(
				page.getByRole('grid').nth(1).getByRole('button', { name: 'Move card', exact: true })
			).toBeVisible();
			await expect(move).toBeFocused();
			await expectAccessible(page);
		});
	});
}

for (const theme of ['Light', 'Dark']) {
	test(`${theme}: preview badge contrast and header menus`, async ({ page }) => {
		await page.goto('/');
		const themeButton = page
			.getByRole('button', { name: 'Toggle theme', exact: true })
			.filter({ visible: true });
		await themeButton.click();
		await page.getByRole('menuitemradio', { name: theme, exact: true }).click();
		const badge = page.locator('[data-slot="badge"]').filter({ hasText: /^Preview$/i });
		await badge.scrollIntoViewIfNeeded();
		await expect(badge).toBeVisible();
		const contrast = await new AxeBuilder({ page })
			.include('[data-slot="badge"]')
			.withRules(['color-contrast'])
			.analyze();
		expect(contrast.violations).toEqual([]);
		expect(contrast.passes.some(({ id }) => id === 'color-contrast')).toBe(true);
		for (const button of [
			page.locator('header').getByRole('button', { name: 'Svelte', exact: true }),
			themeButton
		]) {
			await button.click();
			await expect(page.getByRole('menu')).toBeVisible();
			const menu = await new AxeBuilder({ page })
				.include('[role="menu"]')
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
				.analyze();
			expect(menu.violations).toEqual([]);
			await page.keyboard.press('Escape');
			await expect(button).toBeFocused();
		}
	});
}
