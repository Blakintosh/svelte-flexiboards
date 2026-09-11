---
title: Docs for LLMs
description: Give an AI assistant the Flexiboards docs as plain Markdown, or install the Flexiboards skill.
category: Introduction
published: true
---

<script lang="ts">
	import InstallCommand from '$lib/components/docs/install-command.svelte';
	import Only from '$lib/components/docs/only.svelte';
</script>

These docs follow the [llms.txt convention](https://llmstxt.org), so an assistant can read them without scraping HTML. Every page on this site also has a Markdown twin.

## Files

| File                             | What it holds                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [/llms.txt](/llms.txt)           | An index of every docs page with a one-line description, plus the examples and the npm packages. Point an assistant here first. |
| [/llms-full.txt](/llms-full.txt) | The full text of every docs page in one file, for tools that want everything in context at once.                                |
| `/docs/<page>.md`                | Any docs page as Markdown, at the page's own URL with `.md` appended. [/docs/flow-grids.md](/docs/flow-grids.md), for example.  |

## Choose a framework

Markdown accepts a `framework` query parameter. It selects the examples, framework-specific prose, prop names, and API tables—not just code fences. Shared explanations appear once.

<Only svelte>

- [One page](/docs/flow-grids.md?framework=svelte): `/docs/flow-grids.md?framework=svelte`
- [Full docs](/llms-full.txt?framework=svelte): `/llms-full.txt?framework=svelte`

</Only>

<Only react>

- [One page](/docs/flow-grids.md?framework=react): `/docs/flow-grids.md?framework=react`
- [Full docs](/llms-full.txt?framework=react): `/llms-full.txt?framework=react`

</Only>

Omit the query or use `?framework=all` for both frameworks, useful when comparing adapters. These URLs are independent of cookies, so sharing a link always shares the same version. Framework-only migration pages are omitted from the other framework's full docs and return 404 when explicitly requested for it.

Each HTML page advertises the selected version with `<link rel="alternate" type="text/markdown">`, so tools can discover the appropriate plain-text URL.

## Copy a page

Every docs page has a **Copy as Markdown** action under its title, next to the edit link. It copies only the currently selected framework's documentation. **Open Markdown** opens that same version in a new tab. Both actions follow the framework picker automatically.

## Skill

The repository ships a skill that gives an assistant the parts of Flexiboards it would otherwise guess at: which layout to pick, the naming differences between the adapters, the controller actions and callbacks, the rules that bite in React, and how to test a board.

<InstallCommand action="dlx" package="skills add Blakintosh/svelte-flexiboards" />

If you do not use that installer, copy `skills/flexiboards/` from [the repository](https://github.com/Blakintosh/svelte-flexiboards/tree/main/skills/flexiboards) into your project's `.claude/skills/` directory. The skill links back to the Markdown pages above, so it stays short and the docs stay the source of truth.
