---
name: flexiboards-docs-writer
description: Write, edit, or review Flexiboards documentation, including guides, tutorials, component and API references, migrations, and Markdown exports for LLMs. Use for documentation content and examples, framework isolation between Svelte and React, and documentation prose cleanup.
---

# Write Flexiboards documentation

Work from the reader's task and the shipping API. Keep shared facts in one source, expose adapter details only to their audience, and verify both the rendered page and its plain Markdown meaning.

Paths below are relative to the repository root unless linked as skill references. This skill is maintained in `.agents/skills/flexiboards-docs-writer/`; the matching `.claude/skills/` entry links to that directory. Edit the canonical files to keep both agents on the same instructions.

## 1. Establish the reader's task

Before drafting, identify the reader's intended result, prerequisites, target framework, relevant package version, and the existing page that owns the topic. Infer these from the request and source; ask only when an unresolved choice changes the instructions.

Choose the page's primary job:

- Learning by building a first result: tutorial or getting started.
- Completing a known task: how-to guide.
- Looking up a symbol, option, default, or constraint: reference.
- Understanding a mechanism or tradeoff: explanation.
- Updating between releases: migration with explicit source and target versions.

Use [page patterns and examples](references/page-patterns.md) when creating a page, reorganizing content, or adding examples. Link supporting material instead of turning one page into every kind of documentation. Include prerequisites and cautions needed to finish the task even when they come from reference material.

## 2. Establish the facts

Read `site/src/content/README.md`, the target page, and the relevant implementation before writing API claims. Check:

- `packages/core/src/` for shared behavior, types, and controller actions.
- `packages/svelte/src/` and `packages/react/src/` for public props, exports, lifecycle, and reactivity. Verify each adapter independently; matching names do not guarantee matching behavior.
- `site/scripts/extract-api.mjs` and generated API data for reference-table coverage.
- Existing executable examples and tests for the result a reader should observe.

Use the implementation to document current behavior. If code, tests, and the intended contract disagree, identify the discrepancy; do not invent a consistent story. Keep historical release claims tied to the relevant version. Research external APIs in their official documentation when local evidence is insufficient.

## 3. Assign every detail to its framework

Classify prose, headings, code, commands, links, table rows, and demos before placing them:

1. Same meaning and instructions in both adapters? Write it once as shared content.
2. Same sentence, different literal name? Use `FrameworkText` with both alternatives.
3. Different API, behavior, setup, example, or explanation? Gate the complete block with `Only`, including its heading and caveat.
4. Entire page applies to one adapter? Scope its navigation and export availability.
5. Reader explicitly needs an adapter comparison or release history? Label the frameworks and versions in that comparison.

Read [framework isolation and Markdown exports](references/framework-and-exports.md) before editing site docs. A React reader must not need to interpret Svelte binding, snippets, runes, or installation instructions. Apply the same rule in reverse. Check meaning, not just framework names: lifecycle and reactivity claims can leak without mentioning either framework.

## 4. Draft the shortest complete path

Lead with the result or the behavior the page documents. Put required setup before the action that needs it. On an interactive feature page, put a small working demo and its source near the start, after only the context needed to understand it. On a lookup page, put the signature or relevant table first.

Keep one concept per example and build variations from the first working example. Include imports, required setup, and an observable result. Label excerpts and show where they belong. Never present pseudocode, undefined application helpers, or omitted required setup as a runnable example.

Use generated API tables for signatures, types, and defaults. Explain behavior, side effects, timing, failure conditions, and reasons in prose. Correct source declarations or JSDoc and regenerate when a generated fact is wrong; do not patch generated output by hand.

## 5. Edit for substance and voice

Read [voice and editing](references/voice-and-editing.md) for every prose-writing or cleanup task. First check accuracy and completeness; then remove filler and improve sentences. A shorter sentence that loses a condition is a regression.

Use concrete subjects, direct verbs, and task-phrased instructions. Authored prose contains no em dashes and no rhetorical "it's not X, it's Y" framing. Replace those patterns with the actual behavior and its consequence. Preserve exact API identifiers, error text, code syntax, and attributed quotations.

Do not soften documented constraints into vague advice or strengthen uncertain claims into guarantees. Describe what the implementation supports; delete unsupported claims of simplicity, speed, power, or completeness.

## 6. Make each section usable as retrieved context

- Give sections descriptive headings with the API or task name. Avoid headings such as "More" that lose meaning outside the page.
- Keep the relevant framework, version boundary, prerequisite, and caveat beside the claim or code they qualify. Use explicit nouns when "this" or "it" could point outside the section.
- Preserve exact symbols, package names, language-tagged code fences, units, defaults, and return behavior. Do not paraphrase identifiers for variety.
- Put essential instructions in text. Describe what a demo proves; provide text for diagrams and outcomes that would otherwise exist only in an image, tab, or interactive component.
- Keep one authored source for people and LLM exports. A second hand-maintained explanation will drift. Prefer a relevant page or section over requiring the entire docs bundle as context.

Treat `llms.txt` as a discovery convention with tool-dependent support. It does not establish that an agent reads the file or answers correctly. Inspect exported content directly.

## 7. Verify the changed material

Choose checks by what changed, using the commands and limits in [framework isolation and Markdown exports](references/framework-and-exports.md):

- Prose or markup: generate Markdown and inspect the changed page in Svelte, React, and combined forms. Check that content survives without raw documentation components or missing instructions.
- Examples: run or type-check the actual example and exercise the behavior it claims to demonstrate. A prose export test does not execute code fences.
- API facts: regenerate from source, check both adapter tables, and inspect the resulting diff.
- Framework gates, page scope, or docs UI: check the rendered picker states and applicable navigation, headings, tables, and Markdown actions; run the framework browser checks when affected.

Review the diff for unrelated edits, broken links or anchors, repeated facts, and omissions. Report the material changes, checks actually run, and any remaining validation gap. Never say every snippet is tested merely because the site builds.

When maintaining this skill, use [evaluation cases](references/evaluation.md) to exercise its decisions. Read [research and rationale](references/sources.md) when revisiting a rule; it distinguishes published guidance, repository constraints, and house style.
