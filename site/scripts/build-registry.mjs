import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

/*
  A shadcn-svelte registry, built from real Svelte files under src/lib/registry
  (so svelte-check keeps them honest) into static/r/*.json with the file
  contents inline, the shape `shadcn-svelte add <url>` reads. Preview: Svelte
  only, two items, no versioning yet.
*/

const ORIGIN = 'https://svelte-flexiboards.vercel.app';
const SRC = 'src/lib/registry/svelte';
const OUT = 'static/r';

const items = [
	{
		name: 'flexi-handles',
		type: 'registry:component',
		title: 'Flexiboards handles',
		description: 'Grab and resize handles for FlexiWidget, styled with your theme tokens.',
		dependencies: ['@flexiboards/svelte', '@lucide/svelte'],
		registryDependencies: ['utils'],
		files: [
			{ src: 'flexi-handles/grabber.svelte', path: 'lib/components/flexi-handles/grabber.svelte' },
			{ src: 'flexi-handles/resizer.svelte', path: 'lib/components/flexi-handles/resizer.svelte' }
		]
	},
	{
		name: 'flexi-sortable-list',
		type: 'registry:block',
		title: 'Sortable list',
		description:
			'A reorderable list of rows with grab handles, reporting the new order on every drop.',
		dependencies: ['@flexiboards/svelte', '@lucide/svelte'],
		registryDependencies: ['utils', `${ORIGIN}/r/flexi-handles.json`],
		files: [
			{
				src: 'flexi-sortable-list/sortable-list.svelte',
				path: 'lib/components/flexi-sortable-list/sortable-list.svelte'
			}
		]
	}
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const built = items.map((item) => {
	const files = item.files.map((f) => {
		const full = path.join(SRC, f.src);
		if (!existsSync(full)) throw new Error(`registry: missing ${full}`);
		return { path: f.path, type: item.type, content: readFileSync(full, 'utf8') };
	});
	const json = {
		$schema: 'https://shadcn-svelte.com/schema/registry-item.json',
		name: item.name,
		type: item.type,
		title: item.title,
		description: item.description,
		dependencies: item.dependencies,
		registryDependencies: item.registryDependencies,
		files
	};
	writeFileSync(path.join(OUT, `${item.name}.json`), JSON.stringify(json, null, '\t') + '\n');
	return { name: item.name, type: item.type, title: item.title, description: item.description };
});

writeFileSync(
	path.join(OUT, 'registry.json'),
	JSON.stringify(
		{
			$schema: 'https://shadcn-svelte.com/schema/registry.json',
			name: 'flexiboards',
			homepage: ORIGIN,
			items: built
		},
		null,
		'\t'
	) + '\n'
);
console.log(`registry: ${built.length} items -> ${OUT}/`);
