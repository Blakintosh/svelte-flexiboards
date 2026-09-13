/**
 * Blueprint listing colours for Shiki: ink ground, pale body text, component
 * names in fx-accent, props in pale blue, strings in sage, comments and
 * punctuation faint.
 *
 * This is the one place the brand values are written out as literal hexes
 * rather than taken from the token layer — Shiki cannot read CSS variables.
 *
 * Plain JS with no `$lib` alias so `svelte.config.js` (which highlights the
 * markdown fences at build time) and `code-example.svelte` (which highlights
 * the live examples in the browser) can share a single definition.
 *
 * @type {import('shiki').ThemeRegistration}
 */
export const blueprintTheme = {
	name: 'blueprint',
	type: 'dark',
	colors: {
		'editor.background': '#10202E',
		'editor.foreground': '#DFE7EE'
	},
	tokenColors: [
		{
			scope: ['comment', 'punctuation.definition.comment', 'punctuation', 'meta.brace'],
			settings: { foreground: '#7E93A6' }
		},
		{
			scope: [
				'entity.name.tag',
				'support.class.component',
				'entity.name.type',
				'entity.name.class',
				'entity.name.function',
				'support.class'
			],
			settings: { foreground: '#E2452B' }
		},
		{
			scope: [
				'entity.other.attribute-name',
				'variable.other.property',
				'variable.other.object.property',
				'meta.object-literal.key',
				'support.type.property-name',
				'keyword',
				'storage',
				'storage.type',
				'keyword.control'
			],
			settings: { foreground: '#9FC3E0' }
		},
		{
			scope: ['string', 'string.quoted', 'constant.numeric', 'constant.language'],
			settings: { foreground: '#C8E6A0' }
		},
		{
			scope: ['variable', 'variable.other', 'source'],
			settings: { foreground: '#DFE7EE' }
		}
	]
};
