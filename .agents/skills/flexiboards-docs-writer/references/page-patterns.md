# Page patterns and examples

Read when choosing a page structure or authoring examples. Choose the order that answers the reader's next question. These are starting structures; omit sections that have no content and keep supporting reference material behind precise links.

## Select a structure

| Primary job                      | Content order                                                                                                                      | Keep elsewhere                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Getting started or tutorial      | Result and prerequisites; install; smallest working board; one change per step; visible checkpoints; next task                     | Exhaustive options and architectural alternatives             |
| How-to guide                     | Task and prerequisites; ordered actions; expected result; task-specific failure and recovery                                       | A beginner's lesson on every concept used                     |
| Explanation                      | Question or mechanism; mental model; concrete example; reasons and tradeoffs; links to tasks and reference                         | A long installation procedure                                 |
| API reference                    | Symbol or signature; parameters/props and defaults; returns; behavior and caveats; usage; symptom-based troubleshooting            | Repeated introductions or a narrative that delays lookup      |
| Interactive component or feature | Purpose; minimal demo with its source; anatomy when composition matters; API; progressive examples; accessibility; caveats         | A decorative feature list or every option in the opening demo |
| Migration                        | Exact from/to versions; affected users and required changes; rename/removal map; before/after code; behavior changes; verification | Current setup instructions unrelated to the migration         |

For an API page that needs those sections, use Reference, Usage, and Troubleshooting. For a feature page, demonstrate the behavior before asking readers to study a long API table. A short purpose sentence or a required prerequisite may precede the demo so it remains understandable in text-only output.

Create a new page when the topic has a distinct task or API surface that readers need to find directly. Keep a prop-only variation on its parent page. Preserve published URLs and anchors when reorganizing; update inbound links or provide a compatible destination when renaming is necessary.

## Build examples from executable evidence

1. Pick one outcome, such as rendering a board, resizing a widget, or restoring a saved layout.
2. Start from the relevant package exports and an existing working example. Remove unrelated controls, data, styling, and application services while keeping all prerequisites for that outcome.
3. Include imports, file placement when required, and required containers, dimensions, styles, data, and initialization. Use the selected adapter's package and syntax.
4. Explain the action and observable result beside the code. For a drag example, say what to drag and what changes; for a return value, show its shape or a concrete output.
5. Run the actual example and verify that result. If the example is deliberately partial, label it as an excerpt, identify its insertion point, and link the complete runnable source.
6. Add variations one concept at a time. Each copyable variant must be complete or explicitly identify the earlier setup it extends.

Use live `svelte example` and `tsx example` fences when they can run the demonstrated interaction. The displayed source must produce the demonstrated behavior. Do not maintain a separate shortened listing that quietly needs different setup.

Code for copying must not contain unexplained placeholders, pseudocode, ellipses, invented helpers, or omitted required imports. For intentional omissions in an excerpt, use a language-appropriate comment and say what was omitted. Keep output in a separate labeled fence so it is not copied as a command. Mark replaceable values and explain where to obtain them.

Inspect ordinary Markdown fences separately from executable examples. A highlighted listing is not proof of type checking or runtime coverage. Report compilation, execution, and interaction checks accurately.

## Write useful reference prose

Generate signatures, member tables, and defaults from source. For a member with non-obvious behavior, answer the relevant questions that its type cannot answer:

- What state does it read or change, and when does that happen?
- What does omission mean, and which configuration level wins?
- What is returned, including units or coordinate space?
- What can fail or be rejected, and how does the caller observe it?
- What cleanup, lifecycle, framework, or version constraint applies?

Put a prerequisite or consequential caveat before the action it constrains. Put rare failure recovery under the user's symptom, such as "The board has no visible height," when supported by the actual implementation. A warning label alone does not explain a fix.

## Make the layout work in text

Use sentence-case headings and ordered lists for sequences. Use bullets for independent choices and tables for consistent fields or comparisons. Keep table cells concise; put multi-step instructions under a heading rather than inside a wide table.

Provide meaningful link text naming the destination or task. Keep headings in a logical hierarchy without skipping levels for visual size. The site's page layout supplies the title, so do not add a duplicate H1 inside an authored docs body.

Describe the information conveyed by diagrams and demos in text. Do not make color, position, animation, or a screenshot the sole carrier of a required step. For interactive components, document supported keyboard behavior, focus behavior, accessible names or ARIA semantics, and the consumer's responsibilities. Link shared accessibility guidance and add component-specific differences; do not claim compliance without evidence.

Use stable terminology across pages, types, and examples. Explain a new concept once and link to it on later pages. Repeat short prerequisites beside a snippet when a reader or retriever needs them to use that snippet correctly.
