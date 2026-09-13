# Releases

The four scoped packages use a Changesets fixed group: every release versions and publishes `@flexiboards/core`, `@flexiboards/svelte`, `@flexiboards/react`, and `@flexiboards/testing` together.

## Initial 1.0.0

All four manifests are 1.0.0. These scoped packages were absent from the npm registry when checked on 2026-09-13. The pending changes for motion, layout callbacks, and late declarations are included in the initial package changelogs and the site's 1.0.0 notes. They do not need another version bump before the first publish.

Keep the site changelog marked unreleased until npm confirms publication. Then replace its unreleased label with the publish date and remove the upcoming-release note from the migration page.

For the initial launch, use the [launch checklist](../RELEASING.md), including npm access, Hetzner verification, and publication order.

## Validate and stage releases

Run `pnpm release:check` from the repository root. It builds packages, checks types and tarball exports, runs unit tests and lint, installs the tarballs in isolated React and Svelte consumers, and runs Playwright against a production site build. Install Chromium first with `pnpm -C site exec playwright install chromium` if needed.

The Release workflow on `main` calls the complete CI workflow before versioning or staging. With pending changesets it creates a version PR. With no pending changesets it packs unpublished versions and submits them with `npm stage publish`. The repository's `NPM_TOKEN` should permit staging for the `@flexiboards` scope; it does not need permission to bypass 2FA or publish directly.

Staging keeps versions out of the public registry until a maintainer approves them with 2FA on npm. The workflow summary lists the stage IDs and approval commands. It reuses an identical pending stage, and stops if that version has already been staged with different contents, visibility, or a different tag. Git tags and GitHub releases are not created during staging.

npm cannot stage a brand-new package. The first release needs an interactive `npm login` and `pnpm changeset publish` from the checked-out release commit. Until then, the workflow reports **Initial publication required** and uploads the packed candidates without submitting them. See [RELEASING.md](../RELEASING.md) for first-publication and approval instructions.

For later releases, run `pnpm changeset` for each package change that needs release notes. The version PR applies the highest required bump to the fixed group and updates package changelogs. Review the resulting version and notes before merging, then approve all four staged packages before promoting the site. GitHub Actions needs permission to create the version PR.
