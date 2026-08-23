import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import examples from 'mdsvexamples/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), examples],
	// React examples (.tsx) use the automatic JSX runtime; .svelte files are
	// untouched (they go through the Svelte plugin, not esbuild's JSX pass).
	esbuild: {
		jsx: 'automatic',
		jsxImportSource: 'react'
	},
	resolve: {
		alias: {
			// Trial plumbing: serve the docs/demos from the new core-based adapter
			// package instead of the legacy self-contained one. Remove to revert.
			'svelte-flexiboards': '@flexiboards/svelte'
		}
	},
	server: {
		fs: {
			strict: false
		}
	}
});
