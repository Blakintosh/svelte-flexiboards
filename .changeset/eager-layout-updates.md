---
'@flexiboards/core': minor
'@flexiboards/react': patch
'@flexiboards/svelte': patch
---

Report committed layouts before drop animations settle. Replace the 150ms layout callback debounce with microtask batching for boards and responsive boards. Consumers that debounce persistence should do so in their save handler.

Measure cards at their destination size before starting a flight so auto-sized rows update immediately, including when moving between columns of different widths.
