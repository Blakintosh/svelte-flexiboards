import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Validate what npm will actually ship, not just the workspace's source tree.
for (const name of ['core', 'svelte', 'react', 'testing']) {
	const cwd = fileURLToPath(new URL(`../packages/${name}/`, import.meta.url));
	const manifest = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8'));
	const [pack] = Object.values(
		JSON.parse(
			execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
				cwd,
				encoding: 'utf8'
			})
		)
	);
	const files = new Set(pack.files.map(({ path }) => path));
	function check(value) {
		if (typeof value === 'string') {
			if (!files.has(value.replace(/^\.\//, '')))
				throw new Error(`${manifest.name}: exported file ${value} is missing from the tarball`);
		} else {
			for (const entry of Object.values(value)) check(entry);
		}
	}
	check(manifest.exports);
	console.log(`${manifest.name}: all exported runtime and declaration files are packaged`);
}
