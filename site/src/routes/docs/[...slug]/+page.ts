import type { PageLoad } from './$types';
import { getDoc } from '$lib/docs';

export const load = (async ({ params }) => {
    const doc = await getDoc(params.slug);

    return {
        doc
    };
}) satisfies PageLoad;