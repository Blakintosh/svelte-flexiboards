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
	server: {
		fs: {
			strict: false
		}
	}
});
