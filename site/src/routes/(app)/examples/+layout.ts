import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { reactSlugs } from '../../(embed)/embed/shared';

export const load = (async ({ url, parent }) => {
	const slug = url.pathname.split('/').pop();

	if (!slug) {
		redirect(302, '/examples/dashboard');
	}

	// In React mode an unported example redirects to the first ported one, so
	// the server never renders (and the sidebar never links) a Svelte fallback.
	const { framework } = await parent();
	if (framework === 'react' && !reactSlugs.includes(slug)) {
		redirect(302, `/examples/${reactSlugs[0]}`);
	}
	return { slug: slug };
}) satisfies LayoutLoad;
