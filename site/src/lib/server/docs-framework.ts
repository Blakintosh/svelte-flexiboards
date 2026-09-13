import { error } from '@sveltejs/kit';

export type DocsFramework = 'all' | 'svelte' | 'react';

/** Explicit URLs are deterministic for crawlers and caches; never infer from cookies. */
export function docsFramework(url: URL): DocsFramework {
	const value = url.searchParams.get('framework') ?? 'all';
	if (value !== 'all' && value !== 'svelte' && value !== 'react') {
		error(400, 'framework must be svelte, react, or all');
	}
	return value;
}

export function markdownResponse(markdown: string) {
	return new Response(markdown, {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
}
