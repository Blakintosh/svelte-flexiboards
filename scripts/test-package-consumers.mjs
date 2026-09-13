import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit' });
const versions = process.argv.slice(2);
const matrix = versions.length
	? versions
	: ['react@18.0.0', 'react@19.2.8', 'svelte@5.20.0', 'svelte@5.38.6'];
const temp = mkdtempSync(join(tmpdir(), 'flexiboards-consumers-'));
try {
	for (const name of ['core', 'react', 'svelte', 'testing']) {
		run('pnpm', ['-C', `packages/${name}`, 'pack', '--pack-destination', temp]);
	}
	for (const entry of matrix) {
		const [framework, version] = entry.split('@');
		if (!['react', 'svelte'].includes(framework) || !version)
			throw new Error(`Unknown consumer: ${entry}`);
		const consumer = join(temp, entry);
		const tarballs = readdirSync(temp)
			.filter(
				(name) =>
					name.endsWith('.tgz') &&
					['core', framework, 'testing'].some((pkg) => name.startsWith(`flexiboards-${pkg}-`))
			)
			.map((name) => join(temp, name));
		const dependencies = framework === 'react' ? [`react-dom@${version}`] : ['esbuild@0.25.12'];
		run('npm', [
			'install',
			'--prefix',
			consumer,
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			...tarballs,
			entry,
			...dependencies,
			'happy-dom@20.11.2'
		]);
		run(process.execPath, [`scripts/test-${framework}-package.mjs`, consumer]);
	}
} finally {
	rmSync(temp, { recursive: true, force: true });
}
