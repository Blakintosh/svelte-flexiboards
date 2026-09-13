# Releases

The four scoped packages use a Changesets fixed group: every release versions and publishes `@flexiboards/core`, `@flexiboards/svelte`, `@flexiboards/react`, and `@flexiboards/testing` together.

## Initial 1.0.0

All four manifests are 1.0.0. These scoped packages were absent from the npm registry when checked on 2026-09-13. The pending changes for motion, layout callbacks, and late declarations are included in the initial package changelogs and the site's 1.0.0 notes. They do not need another version bump before the first publish.

Keep the site changelog marked unreleased until npm confirms publication. Then replace its unreleased label with the publish date and remove the upcoming-release note from the migration page.

For the initial launch, use the [launch checklist](../RELEASING.md), including npm access, Hetzner verification, and publication order.

## Validate and publish

Run `pnpm release:check` from the repository root. It builds packages, checks types and tarball exports, runs unit tests and lint, installs the tarballs in isolated React and Svelte consumers, and runs Playwright against a production site build. Install Chromium first with `pnpm -C site exec playwright install chromium` if needed.

The Release workflow on `main` calls the complete CI workflow before versioning or publishing. With pending changesets it creates a version PR. With no pending changesets it publishes package versions that are absent from npm. It needs the repository's `NPM_TOKEN` secret and permission to create pull requests.

For later releases, run `pnpm changeset` for each package change that needs release notes. The version PR applies the highest required bump to the fixed group and updates package changelogs. Review the resulting version and notes before merging.
