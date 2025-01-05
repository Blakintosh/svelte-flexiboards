import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
	const slug = url.pathname.split('/').pop();

	return { slug: slug };
}) satisfies LayoutLoad;
