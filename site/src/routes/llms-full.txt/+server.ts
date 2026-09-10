import full from '$lib/generated/llms/llms-full.txt?raw';

export const prerender = true;

/** Every docs page's Markdown, concatenated. Written by scripts/build-llms-docs.mjs. */
export function GET() {
	return new Response(full, {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
}
