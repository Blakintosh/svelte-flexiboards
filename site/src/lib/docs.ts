import { error } from '@sveltejs/kit';

export type DocsPage = {
    content: string;
    meta: {
        title: string;
        description: string;
        category: string;
    }
}

export async function getDoc(path: string): Promise<DocsPage> {
    try {
        console.log(`page: ../content/docs/${path}.md`);
        const doc = await import(`../content/docs/${path}.md`);

        // Don't show an unpublished guide
        if(!doc.metadata.published) {
            throw new Error();
        }

        return {
            content: doc.default,
            meta: doc.metadata
        };
    } catch (e) {
        error(404, 'That guide does not exist.');
    }
}