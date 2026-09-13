# @flexiboards/svelte

## 1.0.0

Initial Svelte 5 adapter for the shared Flexiboards engine. Replaces the `svelte-flexiboards` package; see the [migration guide](https://flexiboards.dev/docs/breaking-changes-to-10).

- Board, target, widget, grab, resize, add, delete, dashboard, and sortable components, with reactive controllers.
- Server-rendered initial layouts, client storage loading with suspense, responsive layouts, and late widget declarations.
- CSS and spring motion presets, committed layout callbacks, and destination-size drop flights.
- Grid rows and cells with one-based ARIA indices, decorative drag previews excluded from assistive technology, and keyboard focus retained after moves.
