import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

const validSlugs = ['dashboard', 'notes', 'numbers', 'flow', 'flexspressive', 'products'];

export const load = (async ({ params }) => {
	if (!validSlugs.includes(params.slug)) {
		error(404, 'Example not found');
	}
	return { slug: params.slug };
}) satisfies PageLoad;
