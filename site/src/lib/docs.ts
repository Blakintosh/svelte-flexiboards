import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';

// Find all docs files in the content/docs directory and its subdirectories
const modules = import.meta.glob<MarkdownModule>('/src/content/docs/**/*.md');

export type DocsPageMeta = {
	title: string;
	description: string;
	category: string;
	published: boolean;
};

export type DocsPage = {
	content: Component;
	meta: DocsPageMeta;
};

interface MarkdownModule {
	default: Component;
	metadata: DocsPageMeta;
}

export async function getDoc(path: string): Promise<DocsPage> {
	const fullPath = `/src/content/docs/${path}.md`;
	const importer = modules[fullPath];

	if (!importer) {
		error(404, 'That guide does not exist.');
	}

	try {
		// Execute the importer function to get the module
		const doc = await importer();

		// Access metadata and default export (the Svelte component)
		const metadata = doc.metadata;
		const content = doc.default;

		// Don't show an unpublished guide
		if (!metadata?.published) {
			throw new Error('Doc not published');
		}

		if (!content || !metadata) {
			console.error(`Failed to load content or metadata for doc: ${path}`);
			throw new Error('Invalid doc format');
		}

		return {
			content: content,
			meta: metadata
		};
	} catch (e: unknown) {
		if (e instanceof Error && e.message === 'Doc not published') {
			error(404, 'That guide does not exist.'); // Treat unpublished same as not found
		} else {
			console.error(`Error loading doc (${path}):`, e);
			error(500, 'Could not load the guide.'); // Or a more specific error if possible
		}
	}
}
