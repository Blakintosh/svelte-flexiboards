# Flexiboards

The headless drag-and-drop toolkit for Svelte and React. Docs, examples and API reference: [flexiboards.dev](https://flexiboards.dev/)

You declare grids and widgets; Flexiboards places the widgets, moves them between grids, resizes them, drives all of it from the keyboard, and exports the result as data you can store. It renders no visuals of its own beyond grid placement, so every class and every element is yours.

## Packages

| Package                                    | What it is                                        |
| ------------------------------------------ | ------------------------------------------------- |
| [`@flexiboards/svelte`](packages/svelte)   | The Svelte 5 adapter                              |
| [`@flexiboards/react`](packages/react)     | The React 18 and 19 adapter                       |
| [`@flexiboards/core`](packages/core)       | The framework-agnostic engine both adapters share |
| [`@flexiboards/testing`](packages/testing) | Helpers for testing a board in happy-dom or jsdom |

```
npm i @flexiboards/svelte
```

```
npm i @flexiboards/react
```

The pre-1.0 package `svelte-flexiboards` stays on npm at 0.4.2. The [migration guide](https://flexiboards.dev/docs/breaking-changes-to-10) covers the move.

## This repository

`packages/` holds the libraries, `site/` the SvelteKit docs site, and `skills/flexiboards` a skill for coding agents. Install with `pnpm install`, build the packages with `pnpm -r --filter './packages/*' build`, then `pnpm -C site dev`. The site loads the packages from their `dist` folders, so rebuild after changing a package.

Release preparation and launch order are documented in [RELEASING.md](RELEASING.md).

Found a problem? Open an issue on the [GitHub issues page](https://github.com/Blakintosh/svelte-flexiboards/issues).

## Licence

MIT. See [LICENSE.md](LICENSE.md).
