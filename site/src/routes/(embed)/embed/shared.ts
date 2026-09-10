export const validSlugs = [
	'dashboard',
	'notes',
	'numbers',
	'flow',
	'flexspressive',
	'products',
	'kanban',
	'form-builder',
	'compound',
	'gallery',
	'launcher',
	'playlist'
];

/**
 * Examples with a real React port under `$lib/react-components/examples/pages`.
 * The rest are stubs; the examples index greys them out in React mode and the
 * React embed 404s for them.
 */
export const reactSlugs = ['dashboard', 'numbers', 'flow', 'kanban', 'notes', 'flexspressive', 'products', 'form-builder', 'compound', 'gallery', 'launcher', 'playlist']; // first = React-mode default

/**
 * Svelte examples that opt in to server-side rendering. Everything else mounts
 * client-side, like the React embeds always do: the board appears in its final
 * state rather than server-rendering a stand-in that then updates. Opted-in
 * examples either declare their whole layout (so the server renders the
 * truth) or deliberately demonstrate the suspense fallback. The examples
 * viewer shows the choice as a "Server-side rendering" feature chip.
 */
export const ssrSlugs = [
	'numbers',
	'flow',
	'flexspressive',
	'notes',
	'playlist',
	'compound',
	'products',
	'gallery',
	'launcher',
	'kanban',
	'form-builder'
];
