# Research and rationale

Research checked on 2026-09-13. Revisit these sources when changing the skill's guidance. Ordinary docs edits can use the local procedures without repeating the research pass.

## Published guidance and how it informs this skill

| Source                                                                                                                                                                          | Guidance used                                                                                                              | Limits and local application                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Diátaxis](https://diataxis.fr/)                                                                                                                                                | Organize documentation around tutorials, how-to guides, reference, and explanation, each serving a different reader need.  | The page patterns apply these distinctions locally. They do not prohibit the prerequisite facts needed to complete a tutorial.                                              |
| [Google developer documentation: voice and tone](https://developers.google.com/style/tone)                                                                                      | Use clear, conversational, respectful language; remove clichés, cultural assumptions, and unnecessary verbosity.           | The particular banned phrases and punctuation rules in this skill are house style, not Google's complete policy.                                                            |
| [Google developer documentation: code samples](https://developers.google.com/style/code-samples)                                                                                | Identify code and omissions clearly, introduce samples, and respect the relevant code style.                               | This repo uses fenced mdsvex examples and its own formatting. Actual execution and coverage must be checked locally.                                                        |
| [Google developer documentation: accessibility](https://developers.google.com/style/accessibility)                                                                              | Keep documentation semantically structured and usable without relying on one visual presentation or input method.          | A prose checklist cannot establish product accessibility compliance. Test interactive behavior when it changes.                                                             |
| [Kobak et al., _Delving into LLM-assisted writing in biomedical publications through excess vocabulary_](https://arxiv.org/abs/2406.07016) (Science Advances, 2025)             | Reports aggregate shifts in stylistic vocabulary in biomedical abstracts associated with LLM-assisted writing.             | The study is domain-specific. It does not validate an em-dash detector, a universal banned-word list, or the effectiveness of this skill's editing workflow.                |
| [Anthropic: prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#control-the-format-of-responses) | Give a desired replacement behavior and model the requested style in instructions and examples.                            | This supports pairing restrictions with positive examples. It is vendor guidance, not proof that a particular wording works on every model.                                 |
| [Anthropic: effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)                                                   | Supply concise, relevant context with clear structure and representative examples; avoid unnecessary context accumulation. | Keeping headings and constraints beside claims is our application to retrieved documentation. Retrieval quality still needs evaluation.                                     |
| [The llms.txt proposal](https://llmstxt.org/)                                                                                                                                   | Offers a Markdown discovery file, clean page representations, and links to those representations.                          | This remains a proposal with consumer-dependent behavior. The site already implements a subset; a docs-writing task must not silently migrate its URLs or export format.    |
| [Agent Skills specification](https://agentskills.io/specification)                                                                                                              | Package a skill with `SKILL.md`, `name` and `description` frontmatter, and linked resources loaded as needed.              | Use portable Markdown and relative references. Discovery locations still depend on the agent.                                                                               |
| [Claude Code: skills](https://code.claude.com/docs/en/skills)                                                                                                                   | Project skills live under `.claude/skills/`; a skill directory can be a symlink.                                           | The repo's Claude entry links to the canonical `.agents/skills/` directory. Other compatible agents can load the same files; do not assume every agent scans that location. |

## Local evidence

Repository paths are relative to the root:

- `site/src/content/README.md`: supported framework authoring syntax and selected Markdown URLs.
- `site/src/lib/components/docs/only.svelte` and `framework-text.svelte`: block and inline selection behavior.
- `site/src/lib/components/docs/api-props.svelte`: selected adapter tables and fallback behavior.
- `site/src/lib/docs-directory.ts`: page framework applicability and navigation.
- `site/src/lib/server/docs-framework.ts`: explicit query selection and Markdown response behavior.
- `site/scripts/build-llms-docs.mjs` and its `.test.mjs` companion: supported transformations and limits.
- `site/scripts/extract-api.mjs`: API table generation from both adapters and core.
- `site/scripts/remark-tsx-examples.mjs`: generated live React examples.
- `site/e2e/docs-framework.spec.ts`: checks for framework prose, tables, Markdown actions, and route selection.

The skill's framework procedure comes from these implementations. Do not replace it with generic advice to put code in tabs: tabs alone would miss prose, table cells, page scope, and exported Markdown.

## Editorial choices

The user's requested no-em-dash and no-rhetorical-contrast preferences are explicit house style. Plain verbs, concrete facts, and separate accuracy and expression passes are the mitigation proposed here. Validate them through [evaluation cases](evaluation.md), not through claims of passing an AI detector.

The existing repository skill supplied useful demo-first, cumulative-example, generated-reference, and accessibility conventions. This revision makes them conditional on the reader's task and the actual tooling. It removes the unsupported assertion that every snippet is already tested in CI.

The `emil-writing-skills` method supplies the skill design: encode decisions, give their reasons, keep the entrypoint focused, and exercise the result. The installed skill-creator guidance supplies portable packaging and progressive disclosure. Runtime use of this skill does not require either authoring skill to be installed.
