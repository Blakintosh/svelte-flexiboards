import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: ['../packages/svelte-flexiboards/']
		},
		watch: {
			ignored: ['!**/node_modules/svelte-flexiboards/**']
		}
	},
	optimizeDeps: {
		exclude: ['svelte-flexiboards']
	}
});
