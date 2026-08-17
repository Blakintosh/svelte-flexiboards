import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, escapeSvelte } from "mdsvex";
import { getSingletonHighlighter } from 'shiki';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import { preprocessMeltUI, sequence } from '@melt-ui/pp';
import examples from 'mdsvexamples';
import { blueprintTheme } from './src/lib/shiki-blueprint-theme.js';

const shikiPromise = getSingletonHighlighter({
	themes: [blueprintTheme],
	langs: ['javascript', 'typescript', 'svelte']
});

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.md'],
	highlight: {
		highlighter: async (code, lang = 'text') => {
			const highlighter = await shikiPromise;
			const html = escapeSvelte(highlighter.codeToHtml(code, { lang, theme: 'blueprint' }))
			return `{@html \`${html}\` }`
		}
	},
	remarkPlugins: [
		[remarkToc, { tight: true }], 
		[examples, {
			defaults: {
				Wrapper: '/src/lib/components/ui/code-example/code-example.svelte'
			}
		}]
	],
	rehypePlugins: [rehypeSlug]
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	extensions: ['.svelte', '.md'],
	preprocess: sequence([
		vitePreprocess(),
		mdsvex(mdsvexOptions),
		preprocessMeltUI()
	]),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			runtime: 'nodejs22.x'
		})
	}
};

export default config;
