import full from '$lib/generated/llms/llms-full.txt?raw';
import svelte from '$lib/generated/llms/llms-full-svelte.txt?raw';
import react from '$lib/generated/llms/llms-full-react.txt?raw';
import { docsFramework, markdownResponse } from '$lib/server/docs-framework';
import type { RequestHandler } from './$types';

export const prerender = false;

/** Every docs page's Markdown, concatenated. Written by scripts/build-llms-docs.mjs. */
export const GET: RequestHandler = ({ url }) =>
	markdownResponse({ all: full, svelte, react }[docsFramework(url)]);
