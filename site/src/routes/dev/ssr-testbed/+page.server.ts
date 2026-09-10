import type { FlexiWidgetLayoutEntry } from '@flexiboards/svelte';

/*
  Mocks a server-stored layout for the initialLayout board: each request picks
  one of two arrangements, the way a real app would fetch a user's saved board
  from a database. SvelteKit serializes the picked data to the client, so the
  hydration pass renders from the same layout the server did — the page's
  diagnostics then prove the server HTML and hydrated DOM agree.
*/

const LAYOUT_A: FlexiWidgetLayoutEntry[] = [
	{ type: 'block', x: 0, y: 0, width: 2, height: 1, metadata: { label: 'A: wide first' } },
	{ type: 'block', x: 2, y: 0, width: 1, height: 1, metadata: { label: 'A: corner' } },
	{ type: 'block', x: 1, y: 1, width: 1, height: 1, metadata: { label: 'A: middle' } }
];

const LAYOUT_B: FlexiWidgetLayoutEntry[] = [
	{ type: 'block', x: 0, y: 0, width: 1, height: 2, metadata: { label: 'B: tall first' } },
	{ type: 'block', x: 1, y: 0, width: 2, height: 1, metadata: { label: 'B: wide' } },
	{ type: 'block', x: 1, y: 1, width: 1, height: 1, metadata: { label: 'B: under' } }
];

export function load({ url }: { url: URL }) {
	// ?variant=A|B pins the pick — the page's diagnostics re-fetch their own
	// URL and must get the same layout the live DOM was rendered from.
	const pinned = url.searchParams.get('variant');
	const variant = pinned === 'A' || pinned === 'B' ? pinned : Math.random() < 0.5 ? 'A' : 'B';
	return {
		variant,
		seededLayout: variant === 'A' ? LAYOUT_A : LAYOUT_B
	};
}
