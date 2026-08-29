import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const testing = !!process.env.VITEST;

export default defineConfig({
	// This package is a library, not a SvelteKit app — under test the kit plugin
	// only warns about the app scaffolding it can't find.
	plugins: testing ? [svelte()] : [sveltekit()],
	resolve: testing ? { conditions: ['browser'] } : undefined,
	test: {
		// Component tests mount real components against a DOM. This is the layer
		// where the adapter meets core: Svelte's lazy prop getters and lifecycle
		// on one side, core's synchronous signal effects on the other. Bugs there
		// are invisible to core's own (DOM-free) suite.
		environment: 'happy-dom',
		include: ['tests/**/*.{test,spec}.{js,ts}', 'src/**/*.{test,spec}.{js,ts}']
	}
});
