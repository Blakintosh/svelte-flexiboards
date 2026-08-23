import { error } from '@sveltejs/kit';
import type { PageLoad } from '../$types';
import { validSlugs } from '../../shared';

export const load = (async ({ params }) => {
	if (!validSlugs.includes(params.slug)) {
		error(404, 'Example not found');
	}
	return { slug: params.slug };
}) satisfies PageLoad;
