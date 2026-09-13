import { error, redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { reactSlugs } from '../../(embed)/embed/shared';
import { examplePages } from '$lib/example-pages';

export const load = (async ({ url, parent }) => {
	const slug = url.pathname.split('/').pop();

	if (!slug || url.pathname === '/examples') {
		redirect(302, '/examples/dashboard');
	}
	const example = examplePages[slug];
	if (!example) error(404, 'That example does not exist.');

	// In React mode, an unported example redirects to the first ported one, so
	// the server never renders, and the sidebar never links, a Svelte fallback.
	const { framework } = await parent();
	if (framework === 'react' && !reactSlugs.includes(slug)) {
		redirect(302, `/examples/${reactSlugs[0]}`);
	}
	return {
		slug,
		seo: {
			title: `${example.title} - Examples - Flexiboards`,
			description: example.description
		}
	};
}) satisfies LayoutLoad;
