# Voice and editing

Read for authored prose and prose cleanup. The aim is accurate, useful documentation with a consistent voice. A blacklist alone leaves the underlying vague thought intact; replace the thought with a verifiable action, condition, or result.

## Write from facts

Before polishing a paragraph, identify what it contributes: an action, fact, prerequisite, reason, example, or failure remedy. Delete it if it contributes none of these. Put the main fact first, then its conditions and consequences.

Use second person for instructions, present tense for current behavior, and active voice when the actor matters. Use past tense and exact versions for historical changes. Preserve technical terms and identifier spelling; changing a name for stylistic variety makes lookup harder.

Keep qualifications that affect correctness. Replace "usually" with the actual condition if the source establishes it. If the condition is unknown, investigate or state the uncertainty; do not turn it into "always" to sound decisive.

## Apply house style with concrete replacements

These constraints apply to newly written or edited prose. Preserve code syntax, exact identifiers, quoted errors, and attributed quotations. Do not rewrite untouched historical material just to enforce punctuation.

| Pattern to remove                                                        | Editing action                                                                                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Em dash punctuation, U+2014                                              | Split into sentences; use a colon for an explanation or parentheses for a short aside. Choose based on the relationship between clauses.    |
| "It's not X, it's Y" or "This isn't about X; it's about Y"               | State the actual responsibility or behavior directly. If there is a real comparison, name both concrete behaviors and why choosing matters. |
| "Not just X, but Y"; "more than just"                                    | State the additional capability without a rhetorical buildup.                                                                               |
| "Let's dive in," "in this guide we'll explore," "without further ado"    | Start with the first fact or action.                                                                                                        |
| "It's worth noting," "importantly," "remember that"                      | State the condition or consequence itself.                                                                                                  |
| "Simply," "just," "easy," "obviously" used to minimize effort            | Give the actual step and prerequisite. Keep technical meanings such as "just before commit."                                                |
| "Powerful," "seamless," "robust," "elegant," "blazingly fast"            | State the supported capability or measured result and its conditions, or delete the claim.                                                  |
| "Delve," "leverage," "unlock," "elevate," "empower" as generic promotion | Use the concrete verb: read, use, call, return, configure, save, or remove.                                                                 |
| "For more information, please see"; "click here"                         | Link the name of the related task or API.                                                                                                   |
| "In conclusion," "to summarize," repeated recaps                         | End when the task is complete; add a next step only if it advances the reader's work.                                                       |

This list is an editing aid, not a test of authorship. The no-em-dash rule and rhetorical-pattern restrictions are repository preferences. Research on aggregate vocabulary shifts does not establish that a particular punctuation mark or sentence proves AI authorship.

## Use these transformations as examples

**Draft:** "This isn't just a container; it's a powerful foundation for seamless interactions."

**Rewrite:** "`FlexiBoard` manages the targets and widgets inside it."

The rewrite names a responsibility the implementation can substantiate.

**Draft:** "It's worth noting that React users can simply leverage `useFlexiWidget()` to unlock the controller."

**Rewrite:** "Call `useFlexiWidget()` in a descendant of `FlexiWidget` to read its controller."

The rewrite retains the hook's required context. Place this instruction in a React block.

**Draft:** "Use `class` (or `className` if you're using React) to effortlessly style your widgets."

**Rewrite in mdsvex:** `Set <FrameworkText svelte="class" react="className" code /> on FlexiWidget.`

The selected reader sees one applicable prop. Verify each prop against source before reusing this pattern for another component.

## Run two editing passes

1. **Substance:** Check every API name, prerequisite, framework boundary, causal claim, and expected result against evidence. Remove repetition and unsupported claims. Preserve real limitations and failure recovery.
2. **Expression:** Replace rhetorical buildup, generic praise, vague verbs, and em dashes. Read the resulting paragraph as prose; avoid a series of abrupt fragments or mechanically identical sentences. Keep lists only where their structure helps.

After editing, compare the meaning with the draft and source. Check that scope words such as "only," timing conditions, defaults, and exceptions survived. Review search hits in context instead of bulk-replacing words in code, links, quotations, and technical terms.

For a changed Markdown file, this scan finds candidates for review. It is not a quality gate and will also match examples of discouraged wording:

```sh
rg -n -i '\x{2014}|it.s worth noting|not just|more than just|seamless|delve|leverage|simply' path/to/changed-page.md
```

Prefer showing a good replacement over repeating long lists of bad examples in a writing prompt. Keep the surrounding instructions in the same direct style you want the agent to produce.
