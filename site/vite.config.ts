import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import examples from 'mdsvexamples/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), examples],
	server: {
		fs: {
			strict: false
		}
	}
});
