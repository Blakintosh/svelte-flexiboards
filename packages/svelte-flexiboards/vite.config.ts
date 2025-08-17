import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		minify: false
	},
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined
});
