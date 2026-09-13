# Flexiboards site

The SvelteKit docs and examples site at [flexiboards.dev](https://www.flexiboards.dev/). Run `pnpm dev` after building the workspace packages. `pnpm build-llms-docs` and `pnpm build-registry` regenerate the Markdown exports and registry; both also run before `dev` and `build`.

`pnpm build` creates a standalone Node server in `build/`. Run it with `HOST=127.0.0.1 PORT=3003 ORIGIN=https://www.flexiboards.dev pnpm start`. The [Hetzner deployment guide](../deploy/README.md) covers the Git checkout, systemd service, existing Caddy configuration, and rollback.
