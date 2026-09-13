# Launch Flexiboards 1.0

The release contains `@flexiboards/core`, `@flexiboards/svelte`, `@flexiboards/react`, and `@flexiboards/testing`, all at 1.0.0. The old `svelte-flexiboards` package stays at 0.4.2. Keep the registry labelled preview.

## Complete the external checks

As checked on 2026-09-13:

- The four scoped packages are absent from npm. Confirm that the publishing account can create public packages in the `@flexiboards` scope. Package availability alone does not establish scope ownership.
- This checkout has no working npm login. The repository and its Preview and Production environments have no `NPM_TOKEN` secret. Configure the repository secret for the existing release workflow, or log in locally for the initial publish. Keep credentials out of the repository and terminal transcripts.
- GitHub Actions cannot currently create pull requests. Enable **Allow GitHub Actions to create and approve pull requests** before using the Changesets version-PR flow for later releases.
- Hetzner is reachable through `ssh hetzner`. It already runs Node and Caddy; Flexiboards needs its own service and two Caddy site blocks. Follow the [server deployment instructions](deploy/README.md).
- NVDA verification is pending. Test both adapters at `/dev/accessibility-testbed?framework=svelte` and `/dev/accessibility-testbed?framework=react`. Check reading order, widget labels, grab/cancel/drop announcements, resizing, moving between targets, and where focus lands after each action. Record the NVDA and browser versions with the result.

## Verify the candidate

Use Node 22.13 or later and the repository's pinned pnpm 11.26.0. GitHub Actions installs that pin from `package.json`; the server setup installs the same version for Flexiboards.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm -C site exec playwright install chromium
pnpm release:check
```

The release check covers types, lint, unit/component tests, production browser tests, packed exports, license and changelog inclusion, resolved internal dependencies, and isolated React/Svelte consumer installs. Playwright includes axe checks and explicit browser accessibility-tree checks. These checks complement the manual screen-reader pass.

Inspect the read-only publish plan immediately before publication:

```sh
pnpm changeset publish-plan
```

For the initial release, expect exactly four public packages at 1.0.0 with the `latest` tag. Do not run `pnpm version` for this release: the initial changelogs already include the pending changes.

Review the final diff and commit the candidate. Any changes after verification need the checks relevant to those changes. Keep the commit, publish plan, and verification results together in the release record.

## Verify the Node server

Follow [the Hetzner deployment instructions](deploy/README.md) to pull the reviewed commit, build a standalone release, and smoke-test it on loopback before switching the service. The full Playwright suite runs against this Node adapter too.

The canonical public host is `https://www.flexiboards.dev`; the bare domain redirects there. `SITE_ORIGIN` controls generated absolute URLs at build time. `ORIGIN` tells the running Node server its public URL. Both should match the canonical host for production.

## Publish before promoting the site

A push to `main` starts the Release workflow, which can publish missing npm versions after CI passes. Deploying the site over SSH is a separate action. Keep the new installation instructions behind the loopback service until the packages are published.

For the initial launch:

1. Finish the checks above and log in with the npm account that owns the scope.
2. Run `pnpm ci:publish` from the reviewed commit. This runs the release checks again, then publishes the missing package versions. This is the public release action.
3. Verify all four package versions and `latest` tags on npm. Install each adapter into a clean project from npm and render the documented first board; the tarball tests alone do not verify registry access.
4. Push the four release tags created by Changesets, then merge the reviewed candidate to `main`. The workflow skips versions already on npm. Activate the tested Hetzner release, add the Caddy blocks, and switch DNS when ready.
5. Run the production HTTP smoke check:

   ```sh
   LAUNCH_URL=https://www.flexiboards.dev pnpm -C site e2e:launch
   ```

6. Replace the site's **1.0.0 (unreleased)** label with the actual publication date and remove the upcoming-release note from the migration guide. Publish the release announcement only after the package and production checks pass.

For later releases, follow the [Changesets workflow](.changeset/README.md), then pull and deploy the published commit on Hetzner.

## Recover from a failed launch

If publication stops partway through, inspect `pnpm changeset publish-plan` again. Changesets skips versions already published; rerun from the same reviewed commit after correcting the failure. Do not bump every package just to retry, and do not unpublish a working package.

If a published package needs a code fix, add a patch changeset and release the corrected fixed group. npm package versions cannot be overwritten.

If the site deployment fails, restore the previous `current` symlink and restart the Flexiboards service as described in the deployment guide. Re-run the HTTP smoke check after activation. Keep a record of which package version and site deployment are live so a partial launch is visible.
