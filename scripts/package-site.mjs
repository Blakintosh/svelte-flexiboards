import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSiteArtifact } from './check-site-artifact.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
assert(process.argv[2], 'Usage: node scripts/package-site.mjs /absolute/path/to/new-release');
const destination = resolve(process.argv[2]);
const fromRoot = relative(root, destination);
assert(
	fromRoot.startsWith('../') || fromRoot === '..' || isAbsolute(fromRoot),
	'Keep release directories outside the checkout'
);
assert(!existsSync(destination), 'The release directory already exists; choose a new path');
const run = (args) => execFileSync('pnpm', args, { cwd: root, stdio: 'inherit' });

run(['install', '--prod=false', '--frozen-lockfile']);
run(['build:packages']);
run(['-C', 'site', 'build']);
try {
	run([
		'--config.hoist-workspace-packages=false',
		'--filter=svelte-flexiboards-docs',
		'deploy',
		'--prod',
		'--legacy',
		destination
	]);
	checkSiteArtifact(destination);
} finally {
	// pnpm 11's legacy deploy records production mode in the source workspace state.
	run(['install', '--prod=false', '--frozen-lockfile']);
}
console.log(`Standalone site release: ${destination}`);
