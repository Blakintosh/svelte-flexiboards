import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const runNpm = async (args) => {
	const { stdout } = await exec('npm', args, { maxBuffer: 10 * 1024 * 1024 });
	return JSON.parse(stdout);
};

export async function stagePackages(
	directory,
	{ registry = 'https://registry.npmjs.org', npm = runNpm, report = console.log } = {}
) {
	const plan = JSON.parse(readFileSync(resolve(directory, 'publish-plan.json'), 'utf8'));
	assert.equal(plan.version, 1, 'Unsupported Changesets publish plan');
	const releases = plan.plan.flat().filter((release) => release.kind === 'publish');
	if (!releases.length) {
		report('All current package versions are already published. Nothing to stage.');
		return 'published';
	}
	const candidates = releases.map((release) => {
		assert.equal(release.access, 'public', 'Flexiboards packages must remain public');
		const tarball = resolve(directory, release.tarball.path);
		const path = relative(resolve(directory), tarball);
		assert(path !== '..' && !path.startsWith('../') && !isAbsolute(path), 'Invalid tarball path');
		const bytes = readFileSync(tarball);
		assert.equal(
			`sha256-${createHash('sha256').update(bytes).digest('base64')}`,
			release.tarball.integrity,
			`Tarball integrity mismatch: ${release.name}`
		);
		return { ...release, tarball, shasum: createHash('sha1').update(bytes).digest('hex') };
	});
	const missing = [];
	for (const release of candidates) {
		const response = await fetch(`${registry}/${encodeURIComponent(release.name)}`, {
			signal: AbortSignal.timeout(15_000)
		});
		if (response.status === 404) missing.push(release.name);
		else assert(response.ok, `Registry lookup failed for ${release.name}: HTTP ${response.status}`);
	}
	if (missing.length) {
		report(`Initial publication required for: ${missing.join(', ')}.`);
		report('npm cannot stage brand-new packages. No packages were staged.');
		report(
			'From the checked-out release commit, run npm login, pnpm build:packages, then pnpm changeset publish and complete 2FA. See RELEASING.md.'
		);
		return 'initial-publish-required';
	}
	const prepared = [];
	for (const release of candidates) {
		const stages = await npm(['stage', 'list', release.name, '--json', '--registry', registry]);
		assert(Array.isArray(stages), `Invalid staged package list: ${release.name}`);
		const existing = stages.find(
			(stage) => stage.packageName === release.name && stage.version === release.version
		);
		if (existing) {
			assert(
				existing.shasum === release.shasum &&
					existing.tag === release.tag &&
					existing.access === release.access,
				`${release.name}@${release.version} already has a different staged candidate. Review or reject it on npm before staging a replacement.`
			);
		}
		prepared.push({ release, existing });
	}
	for (const { release, existing } of prepared) {
		let stageId = existing?.id;
		if (!existing) {
			const result = await npm([
				'stage',
				'publish',
				release.tarball,
				'--access',
				release.access,
				'--tag',
				release.tag,
				'--json',
				'--ignore-scripts',
				'--registry',
				registry
			]);
			stageId = result[release.name]?.stageId ?? result.stageId;
		}
		assert.match(stageId ?? '', /^[a-f0-9-]{36}$/i, `Missing or invalid stage ID: ${release.name}`);
		report(
			`${release.name}@${release.version}: ${existing ? 'already staged' : 'staged'} as ${stageId}.`
		);
		report(
			`Approve with npm stage approve ${stageId}, or use npm's Staged Packages page. Approval requires your 2FA.`
		);
	}
	return 'awaiting-approval';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert(process.argv[2], 'Usage: pnpm release:stage /path/to/changesets-pack-output');
	const report = (message) => {
		console.log(message);
		if (process.env.GITHUB_STEP_SUMMARY)
			appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n\n`);
	};
	const status = await stagePackages(resolve(process.argv[2]), { report });
	if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `status=${status}\n`);
	if (status === 'initial-publish-required' && process.env.GITHUB_ACTIONS) {
		console.log(
			'::warning::Initial npm publication requires a maintainer login and 2FA. See the release summary.'
		);
	}
}
