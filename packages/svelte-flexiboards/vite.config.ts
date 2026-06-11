import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined,
	test: {
		// Only run tests from source — without this, vitest also picks up the compiled copies
		// in .svelte-kit/__package__, running every test twice (and against stale output).
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
