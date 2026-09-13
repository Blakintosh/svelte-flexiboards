import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const temp = mkdtempSync(join(tmpdir(), 'flexiboards-artifacts-'));
let releaseVersion;
try {
	for (const name of ['core', 'svelte', 'react', 'testing']) {
		const cwd = fileURLToPath(new URL(`../packages/${name}/`, import.meta.url));
		execFileSync('pnpm', ['pack', '--pack-destination', temp], { cwd, stdio: 'pipe' });
		const archive = join(
			temp,
			readdirSync(temp).find((file) => file.startsWith(`flexiboards-${name}-`))
		);
		const read = (file) =>
			execFileSync('tar', ['-xOf', archive, `package/${file}`], { encoding: 'utf8' });
		const manifest = JSON.parse(read('package.json'));
		const files = new Set(
			execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' })
				.trim()
				.split('\n')
				.map((file) => file.replace(/^package\//, ''))
		);
		const label = manifest.name;
		releaseVersion ??= manifest.version;
		assert.equal(manifest.version, releaseVersion, `${label}: fixed release versions must match`);
		assert.equal(manifest.publishConfig.access, 'public');
		assert.equal(manifest.repository.directory, `packages/${name}`);
		for (const file of ['README.md', 'LICENSE.md', 'CHANGELOG.md']) {
			assert(files.has(file), `${label}: ${file} is missing from the tarball`);
		}
		assert(
			read('CHANGELOG.md').includes(`## ${manifest.version}`),
			`${label}: release notes missing`
		);
		assert(read('LICENSE.md').includes('MIT License'), `${label}: license text missing`);
		for (const file of files) {
			assert(!/\.(test|spec)\.|(^|\/)tests?\//.test(file), `${label}: test file shipped: ${file}`);
		}
		for (const [dependency, version] of Object.entries({
			...manifest.dependencies,
			...manifest.optionalDependencies,
			...manifest.peerDependencies
		})) {
			assert(
				!/^(workspace:|file:|link:)/.test(version),
				`${label}: unresolved dependency ${dependency}`
			);
			if (dependency.startsWith('@flexiboards/')) {
				assert.equal(
					version,
					`^${releaseVersion}`,
					`${label}: internal dependency version differs`
				);
			}
		}
		function checkExport(value) {
			if (typeof value === 'string') {
				assert(files.has(value.replace(/^\.\//, '')), `${label}: export ${value} is missing`);
			} else {
				for (const entry of Object.values(value)) checkExport(entry);
			}
		}
		checkExport(manifest.exports);
		console.log(
			`${label}@${manifest.version}: exports, dependencies, license and changelog verified`
		);
	}
} finally {
	rmSync(temp, { recursive: true, force: true });
}
