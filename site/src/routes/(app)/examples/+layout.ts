import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
	const slug = url.pathname.split('/').pop();

	if(!slug) {
		redirect(302, '/examples/dashboard');
	}
	return { slug: slug };
}) satisfies LayoutLoad;
