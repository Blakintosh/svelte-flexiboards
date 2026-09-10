import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { ORIGIN } from './site-origin.mjs';

/*
  shadcn-style registries, one per framework, built from real component files
  under src/lib/registry (so svelte-check keeps them honest) into
  static/r/<framework>/*.json with the file contents inline: the shape
  `shadcn-svelte add <url>` and `shadcn add <url>` read. Preview: two items
  each, no versioning yet.
*/

const OUT = 'static/r';

const frameworks = {
	svelte: {
		schema: 'https://shadcn-svelte.com/schema',
		src: 'src/lib/registry/svelte',
		ext: 'svelte',
		// Where the files land in the consumer's project.
		root: 'lib/components',
		dependencies: ['@flexiboards/svelte', '@lucide/svelte']
	},
	react: {
		schema: 'https://ui.shadcn.com/schema',
		src: 'src/lib/registry/react',
		ext: 'tsx',
		root: 'components',
		dependencies: ['@flexiboards/react', 'lucide-react']
	}
};

// Item shapes shared by both frameworks; only the file extension differs.
const items = (fw) => [
	{
		name: 'flexi-handles',
		type: 'registry:component',
		title: 'Flexiboards handles',
		description: 'Grab and resize handles for FlexiWidget, styled with your theme tokens.',
		registryDependencies: ['utils'],
		files: [`flexi-handles/grabber.${fw.ext}`, `flexi-handles/resizer.${fw.ext}`]
	},
	{
		name: 'flexi-sortable-list',
		type: 'registry:block',
		title: 'Sortable list',
		description:
			'A reorderable list of rows with grab handles, reporting the new order on every drop.',
		registryDependencies: ['utils', 'flexi-handles'],
		files: [`flexi-sortable-list/sortable-list.${fw.ext}`]
	}
];

rmSync(OUT, { recursive: true, force: true });

let count = 0;
for (const [id, fw] of Object.entries(frameworks)) {
	const dir = path.join(OUT, id);
	mkdirSync(dir, { recursive: true });
	const base = `${ORIGIN}/r/${id}`;

	const built = items(fw).map((item) => {
		const files = item.files.map((src) => {
			const full = path.join(fw.src, src);
			if (!existsSync(full)) throw new Error(`registry: missing ${full}`);
			return { path: `${fw.root}/${src}`, type: item.type, content: readFileSync(full, 'utf8') };
		});
		const json = {
			$schema: `${fw.schema}/registry-item.json`,
			name: item.name,
			type: item.type,
			title: item.title,
			description: item.description,
			dependencies: fw.dependencies,
			// Our own items are referenced by URL; shadcn's by name.
			registryDependencies: item.registryDependencies.map((dep) =>
				dep.startsWith('flexi-') ? `${base}/${dep}.json` : dep
			),
			files
		};
		writeFileSync(path.join(dir, `${item.name}.json`), JSON.stringify(json, null, '\t') + '\n');
		count++;
		return { name: item.name, type: item.type, title: item.title, description: item.description };
	});

	writeFileSync(
		path.join(dir, 'registry.json'),
		JSON.stringify(
			{
				$schema: `${fw.schema}/registry.json`,
				name: 'flexiboards',
				homepage: ORIGIN,
				items: built
			},
			null,
			'\t'
		) + '\n'
	);
}
console.log(`registry: ${count} items -> ${OUT}/{svelte,react}/`);
