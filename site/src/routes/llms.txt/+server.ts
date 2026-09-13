import llms from '$lib/generated/llms/llms.txt?raw';

export const prerender = true;

/** The llms.txt index: see https://llmstxt.org. Written by scripts/build-llms-docs.mjs. */
export function GET() {
	return new Response(llms, {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
}
