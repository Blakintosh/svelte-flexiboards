import { defineConfig } from '@playwright/test';
import config from './playwright.config';

const target = process.env.LAUNCH_URL;

export default defineConfig({
	...config,
	testMatch: 'launch.spec.ts',
	use: { ...config.use, baseURL: target ?? config.use?.baseURL },
	webServer: target ? undefined : config.webServer
});
