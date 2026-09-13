import { defineConfig, devices } from '@playwright/test';

/*
  Browser tests run against the production Node server: real
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
			'node scripts/extract-api.mjs && node scripts/build-llms-docs.mjs && node --test scripts/build-llms-docs.test.mjs && node scripts/build-registry.mjs && vite build && HOST=127.0.0.1 PORT=4173 ORIGIN=http://localhost:4173 node build',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 300_000
	}
});
