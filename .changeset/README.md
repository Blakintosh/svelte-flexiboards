# Changesets

Each change that should appear in a release gets a changeset: a short Markdown file in this directory naming the packages it touches and the bump it needs. Run `pnpm changeset` to write one; CI turns pending changesets into version bumps and changelog entries, and publishes from `main`.

The three packages are linked, so they release together at one version.

`@flexiboards/core`, `@flexiboards/svelte` and `@flexiboards/react` sit at 1.0.0 in their manifests and are not yet on npm at that version, so the first publish needs no changeset.
