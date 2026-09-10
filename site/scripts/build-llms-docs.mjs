/**
 * Builds the AI-readable docs outputs: a Markdown twin of every docs page, an
 * llms.txt index, and an llms-full.txt concatenation.
 *
 * The docs pages are mdsvex: markdown with Svelte components mixed in. This
 * script reads them as text and rewrites the components into Markdown, so the
 * prose stays the single source and nothing here edits the authored files.
 *
 * Output: src/lib/generated/llms/{index.json,llms.txt,llms-full.txt,pages/*.md}
 * Wired into `pnpm build` ahead of `vite build`; run on its own with
 * `pnpm generate-llms`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..');
const docsRoot = path.join(siteRoot, 'src/content/docs');
const apiRoot = path.join(siteRoot, 'src/lib/generated/api');
const outRoot = path.join(siteRoot, 'src/lib/generated/llms');
const pagesOut = path.join(outRoot, 'pages');

const ORIGIN = 'https://svelte-flexiboards.vercel.app';
const SITE_NAME = 'Flexiboards';
const SUMMARY =
	'Flexiboards is a headless drag-and-drop toolkit for Svelte 5 and React 18 or 19 where the grid is the model. You get free-form and flow grids, moves between targets, resizing, a keyboard-driven virtual pointer with screen-reader announcements, layouts you can export and import, and server-side rendering with a suspense fallback.';

/** One-line descriptions for llms.txt, keyed by docs slug. */
const DESCRIPTIONS = {
	overview: 'Meet the three components a board is built from and put a first board on the page.',
	configuration: 'Set board, target, and widget options, and see which level wins when they overlap.',
	controllers: 'Reach a board, target, or widget controller to read and change its state from code.',
	accessibility: 'Move and resize widgets from the keyboard, and hear what the announcer reads out.',
	'breaking-changes-to-10': 'Update code written against v0.x to the v1.0 API.',
	'breaking-changes-to-04': 'Update Svelte code written against v0.3 to the v0.4 API.',
	'breaking-changes-to-03': 'Update Svelte code written against v0.2 to the v0.3 API.',
	'flow-grids': 'Keep widgets in order and packed, for Kanban columns, sortable lists, and galleries.',
	'free-form-grids': 'Place widgets at fixed coordinates and choose what happens when they collide.',
	'multiple-targets': 'Run several targets on one board and move widgets between them.',
	'widget-rendering': 'Choose what a widget renders, from inline content to a registry of components.',
	transitions: 'Animate widgets as they move, resize, appear, and leave.',
	'guides/exporting-importing-boards': 'Save a board layout to your server and load it back later.',
	'guides/responsive-layouts': 'Give each breakpoint its own layout with ResponsiveFlexiBoard.',
	'guides/server-side-rendering': 'Render a board on the server and show a fallback until the layout is confirmed.',
	'components/board': 'Props, controller members, and configuration types for FlexiBoard.',
	'components/target': 'Props, controller members, and layout types for FlexiTarget.',
	'components/widget': 'Props, controller members, and configuration types for FlexiWidget.',
	'components/grab': 'Props and controller members for FlexiGrab, the drag handle.',
	'components/resize': 'Props and controller members for FlexiResize, the resize handle.',
	'components/responsive-board': 'Props, controller members, and configuration for ResponsiveFlexiBoard.',
	'components/adder': 'Props and controller members for FlexiAdd, which creates widgets on drag.',
	'components/deleter': 'Props and controller members for FlexiDelete, which removes dropped widgets.'
};

/* ---------------------------------------------------------------- helpers */

function walk(dir, base = '') {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
		const rel = base ? `${base}/${entry.name}` : entry.name;
		if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel));
		else if (entry.name.endsWith('.md')) out.push(rel.replace(/\.md$/, ''));
	}
	return out;
}

/** Minimal frontmatter reader: flat `key: value` pairs, quotes optional. */
function readFrontmatter(source) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
	if (!match) return { meta: {}, body: source };
	const meta = {};
	for (const line of match[1].split(/\r?\n/)) {
		const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
		if (!kv) continue;
		let value = kv[2].trim().replace(/^['"]|['"]$/g, '');
		meta[kv[1]] = value === 'true' ? true : value === 'false' ? false : value;
	}
	return { meta, body: source.slice(match[0].length) };
}

/** Reads the page order and titles the site itself uses. */
function readDirectory() {
	const src = fs.readFileSync(path.join(siteRoot, 'src/lib/docs-directory.ts'), 'utf8');
	const body = src.slice(src.indexOf('export const directory'));
	const sections = [];
	const sectionRe = /section:\s*'([^']+)'([\s\S]*?)(?=\n\t\},?\n\t\{\n\t\tsection:|\n\t\}\n\];)/g;
	let m;
	while ((m = sectionRe.exec(body))) {
		const pages = [];
		const pageRe = /\{\s*title:\s*'([^']+)',\s*href:\s*'([^']+)'([^}]*)\}/g;
		let p;
		while ((p = pageRe.exec(m[2]))) {
			const frameworks = [...p[3].matchAll(/'(svelte|react)'/g)].map((f) => f[1]);
			pages.push({ title: p[1], href: p[2], frameworks: frameworks.length ? frameworks : null });
		}
		sections.push({ section: m[1], pages });
	}
	return sections;
}

const apiCache = new Map();
function loadApi(file) {
	if (!apiCache.has(file)) {
		const full = path.join(apiRoot, file);
		apiCache.set(file, fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : null);
	}
	return apiCache.get(file);
}

function resolvePath(root, dotted) {
	return dotted
		.split('.')
		.slice(1)
		.reduce((acc, key) => (acc == null ? acc : acc[key]), root);
}

const escapeCell = (text) => String(text ?? '').replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|').trim();

/** Renders one list of API entries as a Markdown table. */
function apiTable(entries, title) {
	if (!Array.isArray(entries) || entries.length === 0) return '';
	const lines = [];
	if (title) lines.push(`**${title}**`, '');
	lines.push('| Name | Type | Description |', '| --- | --- | --- |');
	for (const item of entries) {
		const flags = [];
		if (item.bindable) flags.push('bindable');
		if (item.readonly) flags.push('readonly');
		const name = `\`${item.name}\`${flags.length ? ` (${flags.join(', ')})` : ''}`;
		const notes = [];
		if (item.description) notes.push(escapeCell(item.description));
		if (item.default) notes.push(`Default: \`${escapeCell(item.default)}\`.`);
		if (item.deprecated) notes.push(`Deprecated: ${escapeCell(item.deprecated)}`);
		lines.push(`| ${name} | \`${escapeCell(item.type)}\` | ${notes.join(' ') || '—'} |`);
	}
	lines.push('');
	return lines.join('\n');
}

/**
 * Inline HTML with a Markdown equivalent is converted; the rest is stripped.
 * Only ever applied to prose lines, never to lines inside a code fence.
 */
function inlineHtml(line) {
	return line
		.replace(/<\/?(?:code|kbd)>/g, '`')
		.replace(/<br\s*\/?>/g, '  ')
		.replace(/<\/?(?:span|p|div|strong|em)\b[^>]*>/g, '')
		.replace(/[ \t]+$/, '');
}

/** Pulls `attr="value"` pairs out of a component tag. */
function readAttrs(tag) {
	const attrs = {};
	for (const m of tag.matchAll(/([A-Za-z][A-Za-z0-9_-]*)\s*=\s*"([^"]*)"/g)) attrs[m[1]] = m[2];
	return attrs;
}

/* ------------------------------------------------------------ transformer */

/**
 * Rewrites one mdsvex page into plain Markdown.
 *
 * Component handling:
 *   <script>            dropped (its `api` import is remembered)
 *   <!-- … -->          dropped
 *   <Only svelte|react> a bold "Svelte" / "React" lead line; both variants kept
 *   <ApiProps>          Svelte and React prop tables
 *   <ApiReference>      one table from the generated API JSON
 *   <Callout>/<HeadsUp> a blockquote led by a bold title
 *   anything else       dropped
 *   ```lang example …   plain ```lang fence, title on the line above
 */
function transform(body, { slug }) {
	const lines = body.split(/\r?\n/);
	const out = [];
	const unhandled = new Set();
	let apiJson = null;

	let fence = null; // closing fence marker while inside a code block
	let inScript = false;
	let inComment = false;
	let callout = null; // open blockquote wrapper

	const push = (line) => {
		// A callout body is authored indented; left as-is it would read as a
		// code block once it sits behind a blockquote marker.
		const text = callout && !fence ? line.replace(/^\s+/, '') : line;
		out.push(callout ? (text ? `> ${text}` : '>') : text);
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		if (fence) {
			push(line);
			if (trimmed.startsWith(fence)) fence = null;
			continue;
		}

		// Fence opener: strip mdsvexamples attributes, surface the title.
		const opener = /^(\s*)(`{3,}|~{3,})\s*([A-Za-z0-9+-]*)(.*)$/.exec(line);
		if (opener) {
			fence = opener[2];
			const lang = opener[3];
			const rest = opener[4] ?? '';
			const title = /title\s*=\s*"([^"]*)"/.exec(rest)?.[1];
			if (title) {
				push(`Example: ${title}`);
				push('');
			}
			push(`${opener[2]}${lang}`);
			continue;
		}

		if (inScript) {
			const api = /from\s+'\$lib\/generated\/api\/([^']+)'/.exec(line);
			if (api) apiJson = loadApi(api[1]);
			if (/<\/script>/.test(line)) inScript = false;
			continue;
		}
		if (/^<script\b/.test(trimmed)) {
			const api = /from\s+'\$lib\/generated\/api\/([^']+)'/.exec(line);
			if (api) apiJson = loadApi(api[1]);
			if (!/<\/script>/.test(line)) inScript = true;
			continue;
		}

		if (inComment) {
			if (trimmed.includes('-->')) inComment = false;
			continue;
		}
		if (trimmed.startsWith('<!--')) {
			if (!trimmed.includes('-->')) inComment = true;
			continue;
		}

		// Framework gates.
		const only = /^<Only\b([^>]*)>$/.exec(trimmed);
		if (only) {
			const svelte = /\bsvelte\b/.test(only[1]);
			const react = /\breact\b/.test(only[1]);
			if (svelte !== react) {
				push(`**${svelte ? 'Svelte' : 'React'}**`);
				push('');
			}
			continue;
		}
		if (trimmed === '</Only>') continue;

		// Install commands: the npm form, as a shell listing.
		const install = /^<InstallCommand\b([^>]*)\/>\s*$/.exec(trimmed);
		if (install) {
			const attr = (name) => (new RegExp(name + '="([^"]*)"').exec(install[1]) || [])[1];
			const verbs = { add: 'npm install', remove: 'npm uninstall', dlx: 'npx' };
			// Either one command, or `steps={[{ action, package }, …]}` as several lines.
			const stepsAttr = /steps=\{(\[.*\])\}/.exec(install[1]);
			const steps = stepsAttr
				? [...stepsAttr[1].matchAll(/\{([^}]*)\}/g)].map((m) => ({
						action: (/action:\s*'([^']*)'/.exec(m[1]) || [])[1],
						package: (/package:\s*'([^']*)'/.exec(m[1]) || [])[1]
					}))
				: [{ action: attr('action'), package: attr('package') }];
			out.push('```shell', ...steps.map((s) => `${verbs[s.action || 'add']} ${s.package}`), '```');
			continue;
		}

		// Callouts.
		const calloutOpen = /^<(Callout|HeadsUp)\b([^>]*)>(.*)$/.exec(trimmed);
		if (calloutOpen && !callout) {
			const attrs = readAttrs(calloutOpen[2]);
			const fallback = { warning: 'Heads up', danger: 'Warning' }[attrs.variant] ?? 'Note';
			callout = calloutOpen[1];
			out.push('');
			out.push(`> **${attrs.title || fallback}**`);
			out.push('>');
			const inline = calloutOpen[3].replace(new RegExp(`</${callout}>$`), '').trim();
			if (inline) push(inlineHtml(inline));
			if (new RegExp(`</${callout}>`).test(calloutOpen[3])) {
				callout = null;
				out.push('');
			}
			continue;
		}
		if (callout && trimmed === `</${callout}>`) {
			callout = null;
			out.push('');
			continue;
		}

		// API tables.
		const apiProps = /^<ApiProps\b([^>]*)\/>$/.exec(trimmed);
		if (apiProps) {
			const attrs = readAttrs(apiProps[1]);
			const title = attrs.title || 'Props';
			if (!apiJson) {
				unhandled.add('ApiProps without a resolvable api import');
				continue;
			}
			const svelteRows = apiJson.props ?? [];
			const reactRows = apiJson.propsReact ?? null;
			if (reactRows) {
				push(apiTable(svelteRows, `${title} — Svelte`));
				push(apiTable(reactRows, `${title} — React`));
			} else {
				push(apiTable(svelteRows, title));
			}
			continue;
		}

		const apiRef = /^<ApiReference\b([^>]*)\/>$/.exec(trimmed);
		if (apiRef) {
			const attrs = readAttrs(apiRef[1]);
			const dotted = /api\s*=\s*\{([^}]+)\}/.exec(apiRef[1])?.[1]?.trim();
			const rows = apiJson && dotted ? resolvePath(apiJson, dotted) : null;
			if (rows) push(apiTable(rows, attrs.title || 'Reference'));
			else unhandled.add(`ApiReference api={${dotted}} in ${slug}`);
			continue;
		}

		// Any other component tag: nothing sensible to render, so drop it.
		const other = /^<\/?([A-Z][A-Za-z0-9]*)\b[^>]*\/?>$/.exec(trimmed);
		if (other) {
			// A component may carry an `alt` attribute: prose that stands in for it here.
			const alt = /\balt="([^"]*)"/.exec(trimmed);
			if (alt) {
				out.push(alt[1]);
				continue;
			}
			unhandled.add(`${other[1]} (dropped) in ${slug}`);
			continue;
		}

		// Site-relative links only make sense with an origin in front of them.
		push(inlineHtml(line).replace(/\]\((\/[^)\s]*)\)/g, (_, href) => `](${ORIGIN}${href})`));
	}

	// Collapse runs of blank lines left behind by dropped blocks.
	const text = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
	return { text, unhandled: [...unhandled] };
}

/* ------------------------------------------------------------------- main */

const directory = readDirectory();
const slugs = walk(docsRoot);
const bySlug = new Map();
const allUnhandled = [];

fs.rmSync(outRoot, { recursive: true, force: true });
fs.mkdirSync(pagesOut, { recursive: true });

for (const slug of slugs) {
	const source = fs.readFileSync(path.join(docsRoot, `${slug}.md`), 'utf8');
	const { meta, body } = readFrontmatter(source);
	if (meta.published === false) continue;
	const { text, unhandled } = transform(body, { slug });
	allUnhandled.push(...unhandled);

	const url = `${ORIGIN}/docs/${slug}`;
	const header = [
		`# ${meta.title ?? slug}`,
		'',
		meta.description ? `> ${meta.description}` : null,
		meta.description ? '' : null,
		`Source: ${url}`,
		''
	]
		.filter((l) => l !== null)
		.join('\n');

	const markdown = `${header}\n${text}\n`;
	const file = path.join(pagesOut, `${slug.replace(/\//g, '__')}.md`);
	fs.writeFileSync(file, markdown);
	bySlug.set(slug, { slug, url, title: meta.title ?? slug, description: meta.description ?? '', category: meta.category ?? '', markdown });
}

// llms.txt — curated, in the order the site's sidebar uses.
const generated = new Date().toISOString().slice(0, 10);
const listed = new Set();
const sections = [];

for (const section of directory) {
	const items = [];
	for (const page of section.pages) {
		const slug = page.href.replace(/^\/docs\//, '');
		const entry = bySlug.get(slug);
		if (!entry) continue;
		listed.add(slug);
		const note = DESCRIPTIONS[slug] ?? entry.description;
		const only = page.frameworks ? ` (${page.frameworks.map((f) => (f === 'svelte' ? 'Svelte' : 'React')).join(' and ')} only)` : '';
		items.push(`- [${page.title}](${entry.url}.md): ${note}${only}`);
	}
	if (items.length) sections.push({ title: section.section, items });
}

const extras = [...bySlug.keys()].filter((s) => !listed.has(s));
if (extras.length) {
	sections.push({
		title: 'Older migration notes',
		items: extras.map((slug) => {
			const entry = bySlug.get(slug);
			return `- [${entry.title}](${entry.url}.md): ${DESCRIPTIONS[slug] ?? entry.description}`;
		})
	});
}

sections.push({
	title: 'Examples and packages',
	items: [
		`- [Examples](${ORIGIN}/examples): Browse working boards, including a dashboard, a Kanban board, a form builder, and a gallery.`,
		'- [@flexiboards/svelte](https://www.npmjs.com/package/@flexiboards/svelte): The Svelte 5 adapter, published on npm.',
		'- [@flexiboards/react](https://www.npmjs.com/package/@flexiboards/react): The React 18 and 19 adapter, published on npm.',
		'- [@flexiboards/core](https://www.npmjs.com/package/@flexiboards/core): The framework-independent grid engine both adapters build on.\n- [Flexiboards skill for AI agents](https://github.com/Blakintosh/svelte-flexiboards/blob/main/skills/flexiboards/SKILL.md): A Claude skill that carries the API, the adapter differences, and the rules that bite; install it to build boards with an assistant.'
	]
});

const llms = [
	`# ${SITE_NAME}`,
	'',
	`> ${SUMMARY}`,
	'',
	'Every page below is linked as Markdown. Drop the `.md` to read the same page on the site. Code samples come in a Svelte and a React variant, each under its own heading.',
	'',
	`Last generated: ${generated}`,
	'',
	...sections.flatMap((s) => [`## ${s.title}`, '', ...s.items, '']),
	`Full text of every page: ${ORIGIN}/llms-full.txt`,
	''
].join('\n');

const full = [
	`# ${SITE_NAME} documentation`,
	'',
	`> ${SUMMARY}`,
	'',
	`Last generated: ${generated}`,
	'',
	'This file holds the full text of every documentation page, in sidebar order.',
	'',
	...[...directory.flatMap((s) => s.pages.map((p) => p.href.replace(/^\/docs\//, ''))), ...extras]
		.filter((slug) => bySlug.has(slug))
		.map((slug) => `---\n\n${bySlug.get(slug).markdown}`),
	''
].join('\n');

fs.writeFileSync(path.join(outRoot, 'llms.txt'), llms);
fs.writeFileSync(path.join(outRoot, 'llms-full.txt'), full);
fs.writeFileSync(
	path.join(outRoot, 'index.json'),
	JSON.stringify(
		{
			generated,
			origin: ORIGIN,
			pages: [...bySlug.values()].map(({ slug, url, title, description, category }) => ({
				slug,
				url,
				title,
				description,
				category,
				file: `${slug.replace(/\//g, '__')}.md`
			}))
		},
		null,
		'\t'
	) + '\n'
);

console.log(`llms docs: ${bySlug.size} pages -> src/lib/generated/llms/`);
if (allUnhandled.length) console.log(`  dropped/unhandled: ${[...new Set(allUnhandled)].join('; ')}`);
