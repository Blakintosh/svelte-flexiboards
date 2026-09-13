# Evaluate the skill

Read when revising this skill. Test decisions on documentation work, then inspect the actual artifacts. A frontmatter validator or phrase scan cannot establish writing quality.

## Run the exercise

Use a scratch directory or isolated checkout so trial content does not alter shipping docs. Run each relevant task once with the skill and once without the rule being evaluated, using the same source evidence. Keep the outputs for comparison. Use a fresh agent context only when agent execution is available and authorized; otherwise perform a local walkthrough and label that limitation. Do not claim a local walkthrough is an independent model evaluation.

Give the writer the request and source files. Keep the acceptance criteria below for the reviewer so the prompt does not hand the writer the intended answer. Compare correctness, framework isolation, task completion, and preservation of meaning; do not grade exact wording.

## 1. Scope a mixed paragraph

Request: "Document how to style FlexiWidget and read its controller. Support both framework picker states and Markdown. Include a small prop table."

Evidence: the adapter components, `only.svelte`, `framework-text.svelte`, and the docs exporter.

Acceptance: shared purpose appears once; names vary inline; framework-only techniques and their prerequisites stay in complete gated blocks. Generate Svelte, React, and combined output with the exporter's `transform` function. Check prose and table cells as well as code. The selected output must have its own instructions and the combined output must label alternatives.

Compare with step 3 of `SKILL.md` omitted. Inspect whether code-only gating leaves the other framework's prose or props behind.

## 2. Remove rhetoric without deleting the requirement

Request: "Edit this for the React docs: 'It's worth noting that this isn't just a hook; it's a powerful gateway to effortless state access. Simply leverage useFlexiWidget() inside a descendant of FlexiWidget.'"

Evidence: the hook implementation and its context requirement.

Acceptance: the rewrite names the hook, says what it returns, and retains the descendant requirement. It removes promotional filler and rhetorical contrast, preserves identifiers, and places the instruction in the React scope. An em-dash variant of the draft should receive the same treatment.

Compare with the replacement examples and meaning-preservation pass omitted. Reject a shorter rewrite that drops the hook's required context.

## 3. Choose the page's job and verify its example

Request: "Write a short guide to saving and restoring a board layout. Start from the current exporting/importing guide and package sources."

Acceptance: the result is a how-to with prerequisites, an executable path or explicitly labeled excerpts, an observable result, and relevant failure conditions. It links comprehensive reference instead of copying the entire API. Shared layout fields retain their real names even where component props differ. Claims of tested code identify the check that executed or type-checked it.

Compare with page routing and example verification omitted. A working save snippet plus an undefined application-specific load helper must not be reported as a complete runnable guide.

## 4. Check isolated retrieval and page availability

Request: "Review a framework-only migration page and its Markdown export. Then read one usage section in isolation and identify the setup needed to use its code."

Acceptance: the migration names the versions and adapter, scopes navigation and exports, and handles the HTML body's visibility deliberately. Unsupported selected Markdown returns 404 when checked through the site. The isolated section retains its API name, prerequisite, and caveat. Essential information survives export even if an interactive demo is omitted.

Compare with the retrieval and page-scope rules omitted. Inspect for reliance on earlier prose, screenshots, or hidden UI state.

## Report and refine

Record the request, skill revision or rule omitted, source evidence, produced artifacts, executed checks, and failures. Distinguish a manual walkthrough, a transformer check, a browser check, and an independent agent run. Fix rules only for observed decision failures; repeat the affected case after changing the instruction. Do not expand the skill merely to force preferred wording.
