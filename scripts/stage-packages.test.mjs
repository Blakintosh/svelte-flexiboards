import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { stagePackages } from './stage-packages.mjs';

const stageId = '11111111-2222-4333-8444-555555555555';
const name = '@flexiboards/core';
const exec = promisify(execFile);

async function fixture(t, { missing = false, httpStatus = 200 } = {}) {
	const directory = mkdtempSync(join(tmpdir(), 'flexiboards-staging-test-'));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	mkdirSync(join(directory, 'package'));
	writeFileSync(
		join(directory, 'package/package.json'),
		JSON.stringify({
			name,
			version: '1.0.0',
			dependencies: { '@flexiboards/testing': '^1.0.0' }
		})
	);
	execFileSync('tar', ['-czf', join(directory, 'core.tgz'), '-C', directory, 'package']);
	const bytes = readFileSync(join(directory, 'core.tgz'));
	const release = {
		kind: 'publish',
		name,
		version: '1.0.0',
		tag: 'latest',
		access: 'public',
		tarball: {
			path: 'core.tgz',
			integrity: `sha256-${createHash('sha256').update(bytes).digest('base64')}`
		}
	};
	const plan = { version: 1, plan: [[release]] };
	const writePlan = () => writeFileSync(join(directory, 'publish-plan.json'), JSON.stringify(plan));
	writePlan();
	const requests = [];
	const server = createServer(async (request, response) => {
		let body = '';
		for await (const chunk of request) body += chunk;
		requests.push({
			method: request.method,
			url: request.url,
			body: body ? JSON.parse(body) : null
		});
		response.setHeader('content-type', 'application/json');
		if (request.method === 'POST' && request.url.startsWith('/-/stage/package/')) {
			response.end(JSON.stringify({ stageId }));
		} else if (request.url.startsWith('/-/stage?')) {
			response.end(JSON.stringify({ items: [], total: 0 }));
		} else {
			response.statusCode = missing ? 404 : httpStatus;
			response.end(
				JSON.stringify({
					name,
					versions: { '0.9.0': { name, version: '0.9.0' } },
					'dist-tags': { latest: '0.9.0' }
				})
			);
		}
	});
	server.listen(0, '127.0.0.1');
	await once(server, 'listening');
	t.after(() => {
		server.closeAllConnections();
		server.close();
	});
	const registry = `http://127.0.0.1:${server.address().port}`;
	const reports = [];
	return {
		directory,
		release,
		plan,
		writePlan,
		requests,
		reports,
		registry,
		options: { registry, report: (message) => reports.push(message) },
		existing: {
			id: stageId,
			packageName: name,
			version: '1.0.0',
			tag: 'latest',
			access: 'public',
			shasum: createHash('sha1').update(bytes).digest('hex')
		}
	};
}

test('new packages require the initial interactive publish without calling staging', async (t) => {
	const f = await fixture(t, { missing: true });
	assert.equal(
		await stagePackages(f.directory, { ...f.options, npm: () => assert.fail('must not stage') }),
		'initial-publish-required'
	);
	assert(f.reports.some((message) => message.includes('npm login')));
	assert(f.requests.every((request) => request.method === 'GET'));
});

test('published versions do not call npm or the registry', async (t) => {
	const f = await fixture(t);
	f.release.kind = 'tag';
	f.writePlan();
	assert.equal(
		await stagePackages(f.directory, { ...f.options, npm: () => assert.fail('must not stage') }),
		'published'
	);
	assert.equal(f.requests.length, 0);
});

test('npm stages the packed bytes without publishing or approving them', async (t) => {
	const f = await fixture(t);
	const userconfig = join(f.directory, '.npmrc');
	writeFileSync(userconfig, `//127.0.0.1:${new URL(f.registry).port}/:_authToken=test-token\n`);
	const npm = async (args) => {
		const { stdout } = await exec('npm', args, {
			env: {
				...process.env,
				NPM_CONFIG_USERCONFIG: userconfig,
				npm_config_userconfig: userconfig,
				NPM_CONFIG_CACHE: join(f.directory, 'cache'),
				NODE_AUTH_TOKEN: '',
				NPM_TOKEN: '',
				ACTIONS_ID_TOKEN_REQUEST_URL: '',
				ACTIONS_ID_TOKEN_REQUEST_TOKEN: ''
			}
		});
		return JSON.parse(stdout);
	};
	assert.equal(await stagePackages(f.directory, { ...f.options, npm }), 'awaiting-approval');
	const writes = f.requests.filter((request) => request.method !== 'GET');
	assert.equal(writes.length, 1);
	assert.equal(writes[0].method, 'POST');
	assert.equal(decodeURIComponent(writes[0].url), '/-/stage/package/@flexiboards/core');
	const body = writes[0].body;
	assert.equal(body['dist-tags'].latest, '1.0.0');
	assert.equal(body.versions['1.0.0'].dependencies['@flexiboards/testing'], '^1.0.0');
	assert.deepEqual(
		Buffer.from(Object.values(body._attachments)[0].data, 'base64'),
		readFileSync(join(f.directory, 'core.tgz'))
	);
	assert(f.reports.some((message) => message.includes(`npm stage approve ${stageId}`)));
});

test('reruns reuse an identical pending stage', async (t) => {
	const f = await fixture(t);
	const npm = async (args) => {
		assert.equal(args[1], 'list', 'a rerun must not upload again');
		return [f.existing];
	};
	assert.equal(await stagePackages(f.directory, { ...f.options, npm }), 'awaiting-approval');
	assert(f.reports.some((message) => message.includes('already staged')));
});

for (const field of ['shasum', 'tag', 'access']) {
	test(`a pending stage with different ${field} blocks uploads`, async (t) => {
		const f = await fixture(t);
		const npm = async (args) => {
			assert.equal(args[1], 'list');
			return [{ ...f.existing, [field]: 'different' }];
		};
		await assert.rejects(
			stagePackages(f.directory, { ...f.options, npm }),
			/different staged candidate/
		);
	});
}

test('a registry failure is not treated as a missing package', async (t) => {
	const f = await fixture(t, { httpStatus: 503 });
	await assert.rejects(
		stagePackages(f.directory, { ...f.options, npm: () => assert.fail('must not stage') }),
		/HTTP 503/
	);
});

test('tampered tarballs fail before registry access', async (t) => {
	const f = await fixture(t);
	writeFileSync(join(f.directory, 'core.tgz'), 'changed');
	await assert.rejects(stagePackages(f.directory, f.options), /integrity mismatch/);
	assert.equal(f.requests.length, 0);
});

test('npm authentication errors stop the release', async (t) => {
	const f = await fixture(t);
	await assert.rejects(
		stagePackages(f.directory, {
			...f.options,
			npm: async () => {
				throw new Error('npm E401');
			}
		}),
		/npm E401/
	);
});
