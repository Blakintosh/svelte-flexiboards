import { test, expect, type Page } from '@playwright/test';
import { cells, center, drag, frameworks, trackErrors } from './helpers';

type MotionSample = { duration: string; easing: string };

async function recordMotion(page: Page) {
	await page.evaluate(() => {
		const samples: { duration: string; easing: string }[] = [];
		document.documentElement.dataset.motionSamples = '[]';
		const observer = new MutationObserver(() => {
			for (const node of document.querySelectorAll<HTMLElement>('[role="cell"]')) {
				if (
					node.style.position !== 'absolute' ||
					node.getAttribute('aria-grabbed') === 'true' ||
					node.style.pointerEvents === 'none'
				)
					continue;
				if (!node.getBoundingClientRect().width) continue;
				const style = getComputedStyle(node);
				const sample = {
					duration: style.transitionDuration,
					easing: style.transitionTimingFunction
				};
				if (
					!samples.some(
						(value) => value.duration === sample.duration && value.easing === sample.easing
					)
				) {
					samples.push(sample);
				}
			}
			document.documentElement.dataset.motionSamples = JSON.stringify(samples);
		});
		observer.observe(document.body, {
			subtree: true,
			attributes: true,
			attributeFilter: ['style']
		});
		// Each recording ends when the gesture and its flights have settled.
		document.addEventListener('stop-motion-recording', () => observer.disconnect(), { once: true });
	});
}

async function finishRecording(page: Page): Promise<MotionSample[]> {
	await expect(page.locator('[role="cell"][style*="position: absolute"]')).toHaveCount(0);
	return page.evaluate(() => {
		document.dispatchEvent(new Event('stop-motion-recording'));
		return JSON.parse(document.documentElement.dataset.motionSamples ?? '[]');
	});
}

for (const framework of frameworks) {
	test.describe(`${framework} registry motion`, () => {
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

		for (const preference of ['no-preference', 'reduce'] as const) {
			for (const family of ['board', 'dashboard', 'sortable-list']) {
				test(`${family} movement respects ${preference} from first load`, async ({ page }) => {
					const errors = trackErrors(page);
					await page.emulateMedia({ reducedMotion: preference });
					await page.goto(`/docs/registry/${family}`);
					const preview = page.locator('.preview:visible');
					await expect(cells(page, preview)).not.toHaveCount(0);
					await preview.scrollIntoViewIfNeeded();
					await recordMotion(page);
					if (family === 'dashboard') {
						const handle = preview.getByRole('button', { name: 'Resize revenue', exact: true });
						const start = await center(handle);
						await drag(page, handle, { x: start.x, y: start.y + 176 });
						await expect(cells(page, preview).filter({ hasText: '$24,560' })).toHaveAttribute(
							'aria-rowspan',
							'2'
						);
					} else if (family === 'board') {
						await drag(
							page,
							preview.getByRole('button', { name: 'Move write the docs', exact: true }),
							await center(preview.getByRole('grid').nth(1))
						);
						await expect(cells(page, preview.getByRole('grid').nth(0))).toHaveCount(0);
						await expect(cells(page, preview.getByRole('grid').nth(1))).toHaveCount(2);
					} else {
						await drag(
							page,
							preview.getByRole('button', { name: 'Move Research', exact: true }),
							await center(preview.getByRole('button', { name: 'Move Release', exact: true }))
						);
						await expect(preview.getByText(/^Order:/)).not.toHaveText(
							'Order: research, prototype, release'
						);
					}
					const samples = await finishRecording(page);
					if (preference === 'reduce') {
						expect(samples).toEqual([]);
						await expect(preview.getByRole('button').first()).toHaveCSS(
							'transition-property',
							/color/
						);
					} else
						expect(
							samples.some(
								(sample) => sample.duration === (family === 'dashboard' ? '0.15s' : '0.2s')
							)
						).toBe(true);
					expect(errors).toEqual([]);
				});
			}
		}

		test('CSS, spring and disabled presets respond to preference changes without remounting', async ({
			page
		}) => {
			const errors = trackErrors(page);
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await page.goto('/docs/registry/motion');
			const preview = page.locator('.preview:visible');
			const picker = preview.getByLabel('Transition preset');
			await expect(preview.getByText('Drag a handle to compare the presets.')).toBeVisible();
			await preview.scrollIntoViewIfNeeded();

			async function reorder() {
				const order = await preview.getByText(/^Order:/).textContent();
				await recordMotion(page);
				await drag(
					page,
					cells(page, preview).first().getByRole('button'),
					await center(cells(page, preview).last())
				);
				await expect(preview.getByText(/^Order:/)).not.toHaveText(order!);
				const samples = await finishRecording(page);
				await expect(cells(page, preview)).toHaveCount(3);
				expect(
					await cells(page, preview).evaluateAll((nodes) =>
						nodes.map((node) => node.getAttribute('aria-rowindex'))
					)
				).toEqual(['0', '1', '2']);
				return samples;
			}

			expect(await reorder()).toContainEqual({
				duration: '0.2s',
				easing: 'cubic-bezier(0, 0.55, 0.45, 1)'
			});
			await picker.selectOption('spring');
			expect((await reorder()).length).toBeGreaterThan(0);
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await expect(preview.getByText('Reduced motion is on.')).toBeVisible();
			expect(await reorder()).toEqual([]);
			await picker.selectOption('css');
			expect(await reorder()).toEqual([]);
			await page.emulateMedia({ reducedMotion: 'no-preference' });
			await expect(preview.getByText('Drag a handle to compare the presets.')).toBeVisible();
			await picker.selectOption('none');
			expect(await reorder()).toEqual([]);
			await picker.selectOption('css');
			await page.addStyleTag({ content: ':root { --ease-flexi-drop: linear; }' });
			expect(await reorder()).toContainEqual({ duration: '0.2s', easing: 'linear' });
			expect(errors).toEqual([]);
		});
	});
}
