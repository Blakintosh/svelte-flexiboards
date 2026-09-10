import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { reactSlugs } from '../../shared';

export const load = (async ({ params }) => {
	if (!reactSlugs.includes(params.slug)) {
		error(404, 'Example not ported to React yet');
	}
	return { slug: params.slug };
}) satisfies PageLoad;
