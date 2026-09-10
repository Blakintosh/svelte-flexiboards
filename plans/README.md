# Animation plans — site

Audit of `site/` at commit 8070c1b (improve-animations, standard effort).

| #   | Plan                                                                         | Severity | Depends on                                                  | Status |
| --- | ---------------------------------------------------------------------------- | -------- | ----------------------------------------------------------- | ------ |
| 001 | [Sheet: steep ease-out, shorter exit](001-sheet-ease-out.md)                 | HIGH     | —                                                           | DONE   |
| 002 | [Sidebar: no linear, instant on ⌘B](002-sidebar-keyboard-instant.md)         | HIGH     | —                                                           | DONE   |
| 003 | [Popovers/menus: house curve, faster exit](003-popover-menu-timing.md)       | MEDIUM   | —                                                           | DONE   |
| 004 | [Reduced motion for tw-animate + theme icon](004-reduced-motion-floating.md) | MEDIUM   | 003 (same class strings; do 003 first to avoid merge noise) | DONE   |

Recommended order: 001 → 002 → 003 → 004. All are independent edits to
different files except 003/004, which touch adjacent classes.

Not planned (LOW / opportunities), for the record:

- `docs/toc-tree.svelte:27` animates `width` via `transition-all` — swap to `scale-x` with `origin-left`.
- Front page: `.reveal` runs 480ms while hero `fb-rise` runs 600ms — unify to 600ms so the page is on one clock.
- `fb-snap` keyframes in `app.css` are unused: the hero board is interactive by design, so the design's self-moving "grab me" widget was dropped. If wanted, run the loop only until first pointerdown on the board.
- Install-command "Copied" swap has no motion; a 200ms `fb-in` on the label is cheap feedback.
- Buttons have hover but no press feedback; the brand rule forbids scale, but a fill shift on `:active` is within it.
