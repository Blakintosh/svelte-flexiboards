---
title: Docs for LLMs
description: Give an AI assistant the Flexiboards docs as plain Markdown, or install the Flexiboards skill.
category: Introduction
published: true
---

<script lang="ts">
	import InstallCommand from '$lib/components/docs/install-command.svelte';
</script>

These docs follow the [llms.txt convention](https://llmstxt.org), so an assistant can read them without scraping HTML. Every page on this site also has a Markdown twin.

## Files

| File | What it holds |
| --- | --- |
| [/llms.txt](/llms.txt) | An index of every docs page with a one-line description, plus the examples and the npm packages. Point an assistant here first. |
| [/llms-full.txt](/llms-full.txt) | The full text of every docs page in one file, for tools that want everything in context at once. |
| `/docs/<page>.md` | Any docs page as Markdown, at the page's own URL with `.md` appended. [/docs/flow-grids.md](/docs/flow-grids.md), for example. |

The Markdown pages contain both the Svelte and the React code samples, each under its own lead line, and the API tables rendered as Markdown tables. Each HTML page links to its twin with `<link rel="alternate" type="text/markdown">`, so a tool that fetches a page can find the plain version on its own.

## Copy a page

Every docs page has a **Copy as Markdown** action under its title, next to the edit link. It puts the page's Markdown on your clipboard, ready to paste into a chat. **Open Markdown** beside it opens the twin in a new tab if you would rather link to it.

## Skill

The repository ships a skill that gives an assistant the parts of Flexiboards it would otherwise guess at: which layout to pick, the naming differences between the adapters, the controller actions and callbacks, the rules that bite in React, and how to test a board.

<InstallCommand action="dlx" package="skills add Blakintosh/svelte-flexiboards" />

If you do not use that installer, copy `skills/flexiboards/` from [the repository](https://github.com/Blakintosh/svelte-flexiboards/tree/main/skills/flexiboards) into your project's `.claude/skills/` directory. The skill links back to the Markdown pages above, so it stays short and the docs stay the source of truth.
