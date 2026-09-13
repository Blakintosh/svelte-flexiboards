import type { PageLoad } from './$types';
import { getDoc } from '$lib/docs';

export const load = (async ({ params }) => {
	const doc = await getDoc(params.slug);

	return {
		doc,
		seo: { title: `${doc.meta.title} · Docs · Flexiboards`, description: doc.meta.description }
	};
}) satisfies PageLoad;
