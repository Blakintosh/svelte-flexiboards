import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { ORIGIN } from './site-origin.mjs';

/*
  shadcn-style registries, one per framework, built from real component files
  under src/lib/registry (so svelte-check keeps them honest) into
  static/r/<framework>/*.json with the file contents inline: the shape
  `shadcn-svelte add <url>` and `shadcn add <url>` read. Component families,
  not application blocks: consumers own their content and composition.
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
		name: 'flexi-motion',
		type: 'registry:component',
		title: 'Motion',
		description: 'CSS transition presets and reactive reduced-motion support.',
		registryDependencies: [],
		files: ['flexi-motion/index.ts']
	},
	...['grabber', 'resizer'].map((handle) => ({
		name: `flexi-${handle}`,
		type: 'registry:component',
		title: handle === 'grabber' ? 'Grabber' : 'Resizer',
		description: `A themed, keyboard-accessible ${handle} for any FlexiWidget.`,
		registryDependencies: ['utils'],
		files: [`flexi-handles/${handle}.${fw.ext}`]
	})),
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
		type: 'registry:component',
		title: 'Sortable list',
		description:
			'Composable SortableList.Root, Item and handles, with custom content and order callbacks.',
		registryDependencies: ['utils', 'flexi-handles', 'flexi-motion'],
		files: ['index.ts', `root.${fw.ext}`, `item.${fw.ext}`, `sortable-list.${fw.ext}`].map(
			(file) => `flexi-sortable-list/${file}`
		)
	},
	{
		name: 'flexi-dashboard',
		type: 'registry:component',
		title: 'Dashboard',
		description: 'Composable dashboard tiles with themed surfaces, grab handles and resizing.',
		registryDependencies: ['utils', 'flexi-handles', 'flexi-motion'],
		files: [
			'index.ts',
			...['root', 'item', 'header', 'content'].map((part) => `${part}.${fw.ext}`)
		].map((file) => `flexi-dashboard/${file}`)
	},
	{
		name: 'flexi-board',
		type: 'registry:component',
		title: 'Board',
		description:
			'Themed board, target and item primitives for custom layouts and multiple targets.',
		registryDependencies: ['utils', 'flexi-handles', 'flexi-motion'],
		files: ['index.ts', ...['root', 'target', 'item'].map((part) => `${part}.${fw.ext}`)].map(
			(file) => `flexi-board/${file}`
		)
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
			return {
				path: `${fw.root}/${src}`,
				type: item.type,
				// Svelte's built-item schema requires a target relative to the
				// consumer's components alias. Keep each namespace in its folder.
				...(id === 'svelte' && { target: src }),
				content: readFileSync(full, 'utf8')
			};
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
