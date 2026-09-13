import index from '$lib/generated/llms/index.json';
import { examplePages } from '$lib/example-pages';
import { ORIGIN } from '../../../scripts/site-origin.mjs';

export const prerender = true;

export function GET() {
	const paths = [
		'/',
		...index.pages.map(({ slug }) => `/docs/${slug}`),
		...Object.values(examplePages).map(({ href }) => href)
	];
	const urls = paths.map((path) => `<url><loc>${new URL(path, ORIGIN).href}</loc></url>`);
	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`,
		{ headers: { 'content-type': 'application/xml; charset=utf-8' } }
	);
}
