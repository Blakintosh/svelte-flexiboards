---
title: Registry
description: Composable Flexiboards components, copied into your project and styled by your shadcn theme.
category: Registry
published: true
---

<script lang="ts">
 import Only from '$lib/components/docs/only.svelte';
 import FrameworkText from '$lib/components/docs/framework-text.svelte';
</script>

The registry provides styled <FrameworkText svelte="Svelte" react="React" /> components built on the Flexiboards primitives. The CLI copies them into your app, where you can edit the source. They use your existing shadcn theme.

The registry is in preview. Start here for installation details, then choose a component below.

## Components

| Component                                     | Use it for                                                     |
| --------------------------------------------- | -------------------------------------------------------------- |
| [Dashboard](/docs/registry/dashboard)         | Free-form tiles with headers, content, grabbers, and resizers. |
| [Sortable List](/docs/registry/sortable-list) | Reorderable rows with any content you need.                    |
| [Board](/docs/registry/board)                 | Custom layouts and multiple targets on one board.              |
| [Grabber](/docs/registry/grabber)             | A themed drag handle for any widget.                           |
| [Resizer](/docs/registry/resizer)             | A themed resize handle for any resizable widget.               |

Each page has a working preview, source example, installation command, and API notes. The docs framework menu selects the API and examples throughout.

## Motion

Boards, dashboards, and sortable lists animate movement by default and respect reduced motion. [Compare CSS and spring presets](/docs/registry/motion), or disable transitions through the existing configuration.

## Composition

Families use namespace imports: `Dashboard.Root`, `Dashboard.Item`, `Dashboard.Header`, and so on. You control the content and decide where handles belong. The wrappers preserve the underlying configuration and controller APIs.

These are components, not blocks. Full dashboard layouts and other application-level compositions can be added later without replacing these building blocks.

## Your theme, your source

<Only svelte>

Start with a Tailwind project configured for [shadcn-svelte](https://www.shadcn-svelte.com/docs/installation), including its theme variables and `cn` utility.

</Only>

<Only react>

Start with a Tailwind project configured for [shadcn](https://ui.shadcn.com/docs/installation), including its theme variables and `cn` utility.

</Only>

The CLI copies source and resolves the required framework adapter, icons, and utility.

Surfaces inherit `card`, `card-foreground`, `border`, and `muted`; handles inherit `accent` and `ring`. Your existing light and dark theme applies automatically. No fonts, global CSS, or color variables are overwritten.

Use <FrameworkText svelte="class" react="className" code /> to adjust the defaults. Widget class functions can respond to controller state, and consumer classes are merged last. For deeper changes, edit the installed source.

## Registry endpoints

<Only svelte>

The [registry index](/r/svelte/registry.json) lists the installable items.

</Only>

<Only react>

The [registry index](/r/react/registry.json) lists the installable items.

</Only>

`flexi-handles` remains available as a combined grabber/resizer install, and the old convenience sortable list API is retained.

The registry is currently unversioned. Review source diffs before asking the CLI to overwrite an existing installation; copied files do not update automatically with npm package upgrades.

## Two meanings of registry

This source registry is separate from `FlexiBoard.config.registry`. The latter maps widget types to components or snippets when [restoring saved layouts](/docs/guides/exporting-importing-boards). The installed components can be used in those renderers, but installing them does not register persisted widget types for you.
