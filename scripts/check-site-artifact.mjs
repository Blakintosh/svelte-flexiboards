import assert from 'node:assert/strict';
import { existsSync, readdirSync, realpathSync } from 'node:fs';
import { join, relative, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function checkSiteArtifact(directory) {
	const root = realpathSync(directory);
	for (const file of ['package.json', 'build/index.js', 'build/handler.js', 'node_modules']) {
		assert(existsSync(join(root, file)), `Missing release file: ${file}`);
	}
	function visit(directory) {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			if (entry.isSymbolicLink()) {
				const target = relative(root, realpathSync(path));
				assert(
					!target.startsWith('../') && target !== '..' && !isAbsolute(target),
					`Release link points outside the artifact: ${relative(root, path)}`
				);
			} else if (entry.isDirectory()) visit(path);
		}
	}
	visit(root);
	console.log('Site artifact: production files present; all dependency links are internal.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert(process.argv[2], 'Usage: node scripts/check-site-artifact.mjs /path/to/release');
	checkSiteArtifact(process.argv[2]);
}
