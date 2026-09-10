import { expect, type Locator, type Page } from '@playwright/test';

export type Framework = 'svelte' | 'react';
export const frameworks: Framework[] = ['svelte', 'react'];

/** Every example with a port in both adapters (see routes/(embed)/embed/shared.ts). */
export const slugs = [
	'dashboard',
	'notes',
	'numbers',
	'flow',
	'flexspressive',
	'products',
	'kanban',
	'form-builder',
	'compound',
	'gallery',
	'launcher',
	'playlist'
];

export const cells = (page: Page, root: Locator | Page = page) =>
	root.locator('[role="cell"]:not([aria-label="Widget action preview"])');

/** Collects uncaught page errors so a test can assert none happened. */
export function trackErrors(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	return errors;
}

/** Drags with real intermediate pointer moves, the way a hand does. */
export async function drag(page: Page, from: Locator, to: { x: number; y: number }, steps = 12) {
	const box = (await from.boundingBox())!;
	const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	for (let i = 1; i <= steps; i++) {
		await page.mouse.move(
			start.x + ((to.x - start.x) * i) / steps,
			start.y + ((to.y - start.y) * i) / steps
		);
		await page.waitForTimeout(16);
	}
	await page.mouse.up();
}

export const center = async (locator: Locator) => {
	const box = (await locator.boundingBox())!;
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

/** Waits for the board to settle after a drop (transition flights are 150ms). */
export const settle = (page: Page) => page.waitForTimeout(600);

export async function rowIndexes(grid: Locator) {
	return (await cells(grid.page(), grid).evaluateAll((els) =>
		els.map((el) => Number(el.getAttribute('aria-rowindex')))
	)) as number[];
}

export function expectCompact(rows: number[]) {
	expect([...rows].sort((a, b) => a - b)).toEqual(rows.map((_, i) => i));
}
