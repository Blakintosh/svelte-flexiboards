import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';

export type DocsPage = {
    content: Component;
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