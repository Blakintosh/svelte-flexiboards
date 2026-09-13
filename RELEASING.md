# Launch Flexiboards 1.0

The release contains `@flexiboards/core`, `@flexiboards/svelte`, `@flexiboards/react`, and `@flexiboards/testing`, all at 1.0.0. The old `svelte-flexiboards` package stays at 0.4.2. Keep the registry labelled preview.

## Complete the external checks

As checked on 2026-09-13:

- All four scoped packages were published at `1.0.0` with the `latest` tag. Their Git tags point to release commit `53f6838` and have been pushed to GitHub.
- Clean npm installs passed the existing React 19.2.8 and Svelte 5.38.6 consumer checks, including server rendering and hydration. The public site passed all three launch tests and the production server smoke check.
- Later releases use the repository's `NPM_TOKEN` secret with **Read and write (stage only)** permission for the `@flexiboards` scope. Keep 2FA enabled on the publishing account. The token does not need **Bypass two-factor authentication**; the maintainer completes 2FA when approving a staged version.
- GitHub Actions cannot currently create pull requests. Enable **Allow GitHub Actions to create and approve pull requests** before using the Changesets version-PR flow for later releases.
- Hetzner serves `https://www.flexiboards.dev` through Caddy and the running `flexiboards` systemd service. The bare domain redirects to the canonical host. The current checkout is `/opt/apps/flexiboards`; follow the [server deployment instructions](deploy/README.md).
- NVDA verification is pending. Test both adapters at `/dev/accessibility-testbed?framework=svelte` and `/dev/accessibility-testbed?framework=react`. Check reading order, widget labels, grab/cancel/drop announcements, resizing, moving between targets, and where focus lands after each action. Record the NVDA and browser versions with the result.

## Verify the candidate

Use Node 22.14 or later, npm 11.15 or later, and the repository's pinned pnpm 11.26.0 for release checks. GitHub Actions installs the pnpm pin from `package.json` and npm 11.19.1 for staging. The server setup uses the same pnpm version for Flexiboards.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm -C site exec playwright install chromium
pnpm release:check
```

The release check covers types, lint, unit/component tests, staging behavior, production browser tests, packed exports, license and changelog inclusion, resolved internal dependencies, and isolated React/Svelte consumer installs. Playwright includes axe checks and explicit browser accessibility-tree checks. These checks complement the manual screen-reader pass.

Inspect the read-only publish plan immediately before publication:

```sh
pnpm changeset publish-plan
```

For the initial release, expect exactly four public packages at 1.0.0 with the `latest` tag. Do not run `pnpm version` for this release: the initial changelogs already include the pending changes.

Review the final diff and commit the candidate. Any changes after verification need the checks relevant to those changes. Keep the commit, publish plan, and verification results together in the release record.

## Verify the Node server

Follow [the Hetzner deployment instructions](deploy/README.md) to pull the reviewed commit, build a standalone release, and smoke-test it on loopback before switching the service. The full Playwright suite runs against this Node adapter too.

The canonical public host is `https://www.flexiboards.dev`; the bare domain redirects there. `SITE_ORIGIN` controls generated absolute URLs at build time. `ORIGIN` tells the running Node server its public URL. Both should match the canonical host for production.

## Publish the first versions interactively

A push to `main` starts the Release workflow, which stages unpublished versions after CI passes. A maintainer approves those staged versions before they become public. npm requires each package to exist before it can be staged, so the initial `1.0.0` publication happens from an interactive terminal. Until then, CI reports **Initial publication required** in the release summary and saves the candidate tarballs without submitting them.

From a local checkout of the reviewed release commit, run:

```sh
npm login
pnpm build:packages
pnpm changeset publish-plan
pnpm changeset publish
```

Complete npm's login and 2FA prompts. `pnpm changeset publish` publishes the four public `1.0.0` packages and creates their Git tags. Use the interactive npm login for this step; the staging-only CI token cannot publish directly. Keep all versions at `1.0.0` when retrying the initial release.

Verify all four package versions and their `latest` tags on npm. Install each adapter into a clean project from npm and render the documented first board; tarball tests alone do not verify registry access. Push the four release tags created by Changesets:

```sh
git push origin @flexiboards/core@1.0.0 @flexiboards/testing@1.0.0 @flexiboards/svelte@1.0.0 @flexiboards/react@1.0.0
```

## Stage and approve later releases

Follow the [Changesets workflow](.changeset/README.md) to version later releases. After merging the version PR, the Release workflow packs the candidates with pnpm, preserving resolved workspace dependencies, then runs `npm stage publish` on each tarball. The workflow uses npm 11.19.1. Local staging commands require npm 11.15.0 or later and Node 22.14.0 or later.

Open the Release run's summary for the stage IDs, package versions, and approval commands. Review the packages in npm's **Staged Packages** page, or from a terminal logged in with your maintainer account:

```sh
npm stage list
npm stage view <stage-id>
npm stage approve <stage-id>
```

Replace `<stage-id>` with the ID from the release summary. Approval prompts for 2FA and makes that version public. Approve `core` and `testing` before the adapters, then verify all four versions are available before promoting the site. From the release commit, run `pnpm changeset git-tag` and push the four version tags after publication is confirmed. Staging does not create Git tags or GitHub releases.

The Release workflow can also be started with **Run workflow** on GitHub. A rerun reuses matching pending stages and skips already published versions. Keep the **npm-release-candidates** artifact with the release record.

See npm's [staged publishing instructions](https://docs.npmjs.com/staged-publishing/) for the first-publication restriction and approval requirements.

## Promote the site after publication

Activate the tested Hetzner release, add the Caddy blocks, and switch DNS when ready. Run the production HTTP smoke check:

```sh
LAUNCH_URL=https://www.flexiboards.dev pnpm -C site e2e:launch
```

Replace the site's **1.0.0 (unreleased)** label with the actual publication date and remove the upcoming-release note from the migration guide. Publish the release announcement only after the package and production checks pass.

For later releases, pull and deploy the approved release commit on Hetzner.

## Recover from a failed launch

If the initial publication stops partway through, inspect `pnpm changeset publish-plan` again. Changesets skips versions already published; rerun the interactive publish from the same reviewed commit after correcting the failure. Do not bump every package just to retry, and do not unpublish a working package.

If staging stops partway through, rerun the workflow from the same commit. Identical pending stages are reused. If a pending stage differs, review it on npm and reject it with 2FA before staging a replacement. The workflow never deletes or approves pending stages automatically. If approval stops partway through, approve the remaining stages and verify the full release before promoting the site.

If a published package needs a code fix, add a patch changeset and release the corrected fixed group. npm package versions cannot be overwritten.

If the site deployment fails, restore the previous `current` symlink and restart the Flexiboards service as described in the deployment guide. Re-run the HTTP smoke check after activation. Keep a record of which package version and site deployment are live so a partial launch is visible.
