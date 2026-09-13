# Framework isolation and Markdown exports

Read this reference for site documentation, examples, API tables, or export changes. Repository paths are relative to the root. Recheck the named implementation if these conventions change.

## Use the supported authoring components

The site uses mdsvex. Read `site/src/content/README.md` and the components in `site/src/lib/components/docs/` before introducing new markup. The exporter parses a supported subset of that markup; arbitrary Svelte conditions can render correctly while losing meaning in Markdown.

Import `Only` and `FrameworkText` in the page's top-level script. Keep opening and closing `Only` tags on separate lines with blank lines around Markdown content. `FrameworkText` requires literal `svelte` and `react` strings; add `code` for identifiers.

This is an authoring example of gating and inline alternatives, not a complete board:

```md
<script lang="ts">
    import Only from '$lib/components/docs/only.svelte';
    import FrameworkText from '$lib/components/docs/framework-text.svelte';
</script>

## Style a widget

Set <FrameworkText svelte="class" react="className" code /> on `FlexiWidget`.

| Prop                                                    | Purpose                       |
| ------------------------------------------------------- | ----------------------------- |
| <FrameworkText svelte="class" react="className" code /> | Set the widget's CSS classes. |

<Only svelte>

### Read a controller through a binding

Use `bind:controller` to receive the component's controller.

</Only>

<Only react>

### Read a controller inside a widget

Call `useFlexiWidget()` in a descendant component of `FlexiWidget`.

</Only>
```

Gate complete code fences outside the fence. A `svelte` or `tsx` language tag alone does not select a framework. The exporter intentionally preserves code text, including literal documentation tags inside examples.

## Classify by semantics

| Detail                                                        | Placement and check                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shared grid model or core controller method                   | Keep shared after checking that both adapters expose the documented contract.                                                                    |
| `class` / `className`, component `key` / `keyName`            | Use inline alternatives when only the name changes. Do not rename the shared controller member `target.key` or target IDs in serialized layouts. |
| Svelte `bind:controller`, snippets, `$state`, context helpers | Gate the whole instruction and example to Svelte.                                                                                                |
| React hooks, refs, render functions, immutable updates        | Gate the whole instruction and example to React.                                                                                                 |
| `onfirstcreate` or SSR timing                                 | Verify both adapters even though the callback name is shared; keep different timing claims inside their framework blocks.                        |
| Package install or import                                     | Use the selected adapter's package and framework-specific dependencies.                                                                          |
| Cross-adapter comparison                                      | Keep both sides only when the comparison itself answers the reader's task; label them explicitly.                                                |

Do not add an explanation of the other adapter merely to say it works differently. A React guide can explain its own callback without teaching Svelte's binding model.

## API tables and page scope

- Use one `<ApiProps {api} />` with an import from `$lib/generated/api/`. The UI and exporter select `props` for Svelte and `propsReact` for React. Confirm `propsReact` exists when props differ; the current fallback to `props` is not evidence that the APIs match.
- Use `<ApiReference title="Methods" api={api.controller.methods} reactApi={api.controllerReact.methods} />` for controller members. Configuration tables pair `api.types.TypeName` with `api.typesReact.TypeName`. The UI selects the framework; combined Markdown labels differing tables and emits identical tables once.
- Keep supported API component tags on one line and use the import patterns already present in the docs. Check `site/scripts/build-llms-docs.mjs` before using an expression the exporter might not resolve.
- Scope a framework-only listed page in `site/src/lib/docs-directory.ts`, for example `frameworks: ['svelte']`. Unlisted historical pages can use `framework: svelte` frontmatter. Keep both declarations consistent if both exist; the exporter gives frontmatter precedence.
- Preserve shared changelogs and intentional comparisons. Scope framework-only migration instructions to their adapter and name the versions.

Page scope controls discovery, Markdown availability, and the HTML body. An unsupported HTML selection shows an applicability notice and a framework-switch button; it hides the page body and Markdown actions. Verify listed and frontmatter-only pages.

## Inspect exported meaning

`site/scripts/build-llms-docs.mjs` is the exporter. Authored pages live in `site/src/content/docs/`; exported pages live in `site/src/lib/generated/llms/pages/`. Nested slugs use `__` in generated filenames, such as `react/guides__testing.md`.

For the changed page, inspect these HTTP representations when the site is available:

- `/docs/<slug>.md?framework=svelte`
- `/docs/<slug>.md?framework=react`
- `/docs/<slug>.md?framework=all`

The same selection applies to `/llms-full.txt`. No query means combined content. Markdown selection is explicit in the URL and independent of cookies; the HTML picker has its own state. Copy as Markdown, Open Markdown, and the alternate Markdown link should carry the picker selection. Unsupported framework-only Markdown pages return 404 for the other adapter and are omitted from that adapter's full bundle.

Check selected exports for the wrong adapter's prose, identifiers, imports, code fences, table rows, and instructions. Combined output must label alternatives and include shared content once. Review each apparent leak in context: shared model fields, historical facts, and comparisons can legitimately mention another adapter.

Unsupported Svelte control-flow directives and inline `Only` gates fail generation. Unknown components can be dropped with an `unhandled` diagnostic. A successful command does not prove all content survived. Use ordinary Markdown for essential explanations, or a supported textual representation. Resolve new diagnostics in the changed material; verify existing diagnostics have not hidden required content.

## Run checks proportional to the change

Run these from the repository root:

```sh
pnpm --dir site build-llms-docs
pnpm --dir site test:docs
```

The first generates all Markdown representations. The second checks the transformer, including gates, inline alternatives, and API table selection. Neither executes example code.

For changed source API facts, run `pnpm --dir site extract-api` before generating Markdown. For runnable examples or mdsvex markup, use `pnpm --dir site check` and the applicable example, package, or browser check; confirm the changed example is actually included. Ordinary code fences are not automatically type-checked. Live examples use `svelte example` or `tsx example` fences; React modules are generated by `site/scripts/remark-tsx-examples.mjs` during preprocessing.

For changes to framework selection, export routes, or page availability, run `pnpm --dir site e2e docs-framework.spec.ts` and inspect the changed page in both picker states. Read `site/playwright.config.ts`: the suite can build and start the preview server, and its existing scenarios do not cover every docs page. Add a focused assertion only for new behavior or an uncovered regression.

Generators can update files beyond the edited page. Inspect the diff and retain intended outputs; preserve unrelated user work. If an environment dependency prevents a check, name the unverified behavior instead of claiming a pass.
