import type { Handle } from '@sveltejs/kit';
import { FRAMEWORK_COOKIE, isFramework } from '$lib/components/brand/framework.svelte';

/*
  Stamp the stored framework on <html> so CSS can set the accent colour before
  any script runs (see `:root[data-framework]` in app.css). The store itself
  is seeded from the same cookie in the root layout.
*/
export const handle: Handle = ({ event, resolve }) => {
	const fw = event.cookies.get(FRAMEWORK_COOKIE);
	if (!isFramework(fw) || fw === 'svelte') return resolve(event);
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('<html lang="en"', `<html lang="en" data-framework="${fw}"`)
	});
};
