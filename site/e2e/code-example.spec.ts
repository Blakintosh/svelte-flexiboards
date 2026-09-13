import { expect, test } from '@playwright/test';
import { frameworks, trackErrors } from './helpers';

for (const framework of frameworks) {
	for (const width of [1280, 390]) {
		test(`${framework} example source stays readable and scrollable at ${width}px`, async ({
			page,
			context,
			request
		}, testInfo) => {
			const errors = trackErrors(page);
			await page.setViewportSize({ width, height: 900 });
			await page.emulateMedia({ reducedMotion: width === 390 ? 'reduce' : 'no-preference' });
			await context.addCookies([
				{ name: 'flexiboards-framework', value: framework, url: 'http://localhost:4173' }
			]);
			await page.addInitScript((fw) => {
				localStorage.setItem('flexiboards:framework', fw);
				Object.defineProperty(navigator, 'clipboard', {
					value: {
						writeText: async (text: string) => {
							(window as Window & { exampleClipboard?: string }).exampleClipboard = text;
						}
					}
				});
			}, framework);
			await page.goto('/docs/registry/motion');
			const viewer = page.locator('.code-example');
			const label = framework === 'svelte' ? 'Svelte' : 'React';
			const lang = framework === 'svelte' ? 'svelte' : 'tsx';
			await expect(viewer.getByRole('tablist', { name: `${label} example view` })).toBeVisible();
			await expect(viewer.getByText(`Example.${lang}`, { exact: true })).toBeVisible();
			await expect(viewer.getByRole('combobox', { name: 'Transition preset' })).toBeVisible();
			await expect(viewer.getByRole('button', { name: 'Copy code to clipboard' })).toHaveCount(0);
			await viewer.getByRole('tab', { name: 'Code', exact: true }).click();
			const selection = viewer.getByRole('tablist').locator('[aria-hidden="true"]');
			await expect(selection).toHaveCSS('clip-path', 'inset(0px 0px 0px 50%)');
			if (width === 390) {
				await expect(selection).toHaveCSS('transition-property', 'none');
				const inactiveIcon = viewer.locator('.copy-icon.inactive');
				await expect(inactiveIcon).toHaveCSS('transform', 'none');
				await expect(inactiveIcon).toHaveCSS('filter', 'none');
			}
			const source = viewer.getByRole('region', { name: `${label} example source` });
			const code = source.locator('pre.shiki code');
			await expect(code).toBeAttached();

			const markdown = await (
				await request.get(`/docs/registry/motion.md?framework=${framework}`)
			).text();
			const fence = markdown.match(new RegExp('```' + lang + '\\n([\\s\\S]*?)\\n```'));
			expect(await code.textContent()).toBe(fence?.[1]);
			const geometry = await source.evaluate((element) => {
				const pre = element.querySelector('pre')!;
				const styles = getComputedStyle(pre);
				return {
					xOverflow: element.scrollWidth > element.clientWidth,
					yOverflow: element.scrollHeight > element.clientHeight,
					padding: parseFloat(styles.paddingLeft),
					fontSize: parseFloat(styles.fontSize),
					pageOverflow: document.documentElement.scrollWidth > innerWidth
				};
			});
			expect(geometry.xOverflow).toBe(true);
			expect(geometry.yOverflow).toBe(true);
			expect(geometry.padding).toBeGreaterThanOrEqual(16);
			expect(geometry.fontSize).toBeGreaterThanOrEqual(13);
			expect(geometry.pageOverflow).toBe(false);
			await viewer.scrollIntoViewIfNeeded();
			await testInfo.attach('source-viewer', {
				body: await viewer.screenshot({ path: testInfo.outputPath('source-viewer.png') }),
				contentType: 'image/png'
			});

			await source.focus();
			await source.press('Control+End');
			await expect
				.poll(() =>
					source.evaluate(
						(element) => element.scrollHeight - element.clientHeight - element.scrollTop
					)
				)
				.toBeLessThan(2);
			await source.press('ArrowRight');
			await expect.poll(() => source.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
			await viewer.getByRole('button', { name: 'Copy code to clipboard' }).click();
			await expect(viewer.getByRole('status')).toHaveText('Copied');
			expect(
				await page.evaluate(
					() => (window as Window & { exampleClipboard?: string }).exampleClipboard
				)
			).toBe(fence?.[1]);
			await viewer.getByRole('tab', { name: 'Code', exact: true }).focus();
			await page.keyboard.press('ArrowLeft');
			await expect(viewer.getByRole('tab', { name: 'Preview', exact: true })).toHaveAttribute(
				'aria-selected',
				'true'
			);
			await expect(selection).toHaveCSS('clip-path', 'inset(0px 50% 0px 0px)');
			await expect(viewer.getByRole('combobox', { name: 'Transition preset' })).toBeVisible();
			expect(errors).toEqual([]);
		});
	}
}

for (const outcome of ['loaded', 'unmounted', 'failed'] as const) {
	test(`React example loading state handles a ${outcome} module`, async ({
		page,
		context
	}, testInfo) => {
		await context.addCookies([
			{ name: 'flexiboards-framework', value: 'react', url: 'http://localhost:4173' }
		]);
		await page.addInitScript(() => localStorage.setItem('flexiboards:framework', 'react'));
		let requested = false;
		let release!: () => void;
		const pending = new Promise<void>((resolve) => {
			release = resolve;
		});
		await page.route('**/_app/immutable/chunks/*.js', async (route) => {
			const response = await route.fetch();
			if (/export\s*\{[^}]*\bas MotionDemo\s*[},]/.test(await response.text())) {
				requested = true;
				await pending;
				if (outcome === 'failed') {
					await route.abort('failed');
					return;
				}
			}
			await route.fulfill({ response });
		});
		await page.goto('/docs/registry/motion', { waitUntil: 'domcontentloaded' });
		const viewer = page.locator('.code-example');
		try {
			await expect.poll(() => requested).toBe(true);
			await expect(viewer.getByRole('status')).toHaveText('Loading React example…');
			await testInfo.attach('loading-preview', {
				body: await viewer.screenshot(),
				contentType: 'image/png'
			});
			if (outcome === 'unmounted') {
				await viewer.getByRole('tab', { name: 'Code', exact: true }).click();
				await expect(viewer.getByRole('region', { name: 'React example source' })).toBeVisible();
			}
		} finally {
			release();
		}
		if (outcome === 'failed') {
			await expect(viewer.getByRole('alert')).toContainText('Could not load the example.');
			await viewer.getByRole('tab', { name: 'Code', exact: true }).click();
			await expect(viewer.getByRole('region', { name: 'React example source' })).toContainText(
				'MotionDemo'
			);
		} else {
			if (outcome === 'unmounted') {
				await viewer.getByRole('tab', { name: 'Preview', exact: true }).click();
			}
			await expect(viewer.getByRole('combobox', { name: 'Transition preset' })).toBeVisible();
			await expect(viewer.getByRole('status')).toHaveCount(0);
		}
	});
}
