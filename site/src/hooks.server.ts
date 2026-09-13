import type { Handle } from '@sveltejs/kit';
import { FRAMEWORK_COOKIE, isFramework } from '$lib/components/brand/framework.svelte';

/*
  Stamp the stored framework on <html> so CSS can set the accent colour before
  any script runs (see `:root[data-framework]` in app.css). The store itself
  is seeded from the same cookie in the root layout.
*/
export const handle: Handle = async ({ event, resolve }) => {
	const fw = event.cookies.get(FRAMEWORK_COOKIE);
	const response = await resolve(
		event,
		isFramework(fw) && fw !== 'svelte'
			? {
					transformPageChunk: ({ html }) =>
						html.replace('<html lang="en"', `<html lang="en" data-framework="${fw}"`)
				}
			: undefined
	);
	if (/^\/(dev|embed|tests)(\/|$)/.test(event.url.pathname) || response.status >= 400) {
		response.headers.set('x-robots-tag', 'noindex');
	}
	return response;
};
