# Framework-aware docs

Keep shared explanations in one Markdown source. Use `Only` for blocks and `FrameworkText` for inline differences, including table cells. Both follow the docs framework picker and the Markdown export selection.

```svelte
<script lang="ts">
	import Only from '$lib/components/docs/only.svelte';
	import FrameworkText from '$lib/components/docs/framework-text.svelte';
</script>

Use <FrameworkText svelte="class" react="className" code /> to style the widget.

<Only react>React-specific instructions go here.</Only>
```

Keep `Only` tags on their own lines, with blank lines around Markdown content. Nesting is supported. `FrameworkText` takes literal `svelte` and `react` strings; omit `code` for plain text. Keep example fences intact—export never rewrites code inside them.

Use `ApiProps` once; its selected framework table is handled by the UI and exporter. Named API imports are supported, including several references on one page.

`/docs/<slug>.md?framework=svelte|react|all` and `/llms-full.txt?framework=svelte|react|all` select generated representations. No query means all frameworks for backward compatibility. Copy/Open Markdown always supply the picker selection. Responses do not depend on cookies.

Mark framework-only pages in `docs-directory.ts`; older unlisted pages can use `framework: svelte` frontmatter. Keep genuine comparisons and historical changelogs shared.

Run `node scripts/build-llms-docs.mjs` to generate exports and `node --test scripts/build-llms-docs.test.mjs` to check the transformer. Generated Markdown is not authored directly.
