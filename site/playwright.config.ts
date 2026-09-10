import { defineConfig, devices } from '@playwright/test';

/*
  Browser tests run against a production build served by `vite preview`: real
  layout, real pointer and keyboard events, both adapters, no dev-server
  dependency re-optimisation in the way. `pnpm e2e` locally; CI runs the same.
*/
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command:
			'node scripts/extract-api.mjs && node scripts/build-llms-docs.mjs && vite build && vite preview --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 300_000
	}
});
