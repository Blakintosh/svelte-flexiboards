# 002 — Example-app sidebar: no linear easing, no animation on ⌘B

- **Commit:** 8070c1b
- **Severity:** HIGH
- **Category:** Purpose & frequency (plus Easing)
- **Estimated scope:** 4 files, ~10 lines

## Problem

The shadcn sidebar in the examples layout collapses with `transition-[width] duration-200 ease-linear`
(and `ease-linear` on the rail and group label). Two rules broken: `linear` on
non-constant motion is lifeless — nothing physical moves at constant speed — and
the sidebar is toggled by a keyboard shortcut (⌘/Ctrl+B in
`context.svelte.ts:45`). Keyboard-initiated actions must not animate: repeated
constantly, any duration reads as lag between keypress and result.

## Where

| File | Lines | What's there |
| --- | --- | --- |
| `site/src/lib/components/ui/sidebar/sidebar.svelte` | 72 | gap element: `transition-[width] duration-200 ease-linear` |
| `site/src/lib/components/ui/sidebar/sidebar.svelte` | 83 | fixed panel: `transition-[left,right,width] duration-200 ease-linear` |
| `site/src/lib/components/ui/sidebar/sidebar-rail.svelte` | 25 | `transition-all ease-linear` |
| `site/src/lib/components/ui/sidebar/sidebar-group-label.svelte` | 18 | `transition-[margin,opacity] duration-200 ease-linear` |
| `site/src/lib/components/ui/sidebar/context.svelte.ts` | 45 | keyboard handler that calls the toggle |

### Current code

```svelte
<!-- site/src/lib/components/ui/sidebar/sidebar.svelte:72 -->
"w-(--sidebar-width) relative bg-transparent transition-[width] duration-200 ease-linear",
<!-- :83 -->
"w-(--sidebar-width) fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex",
```

```ts
// site/src/lib/components/ui/sidebar/context.svelte.ts:45
if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
```

## Target

1. Every `ease-linear` in the four sidebar files becomes `ease-[var(--ease-snap)]`
   (`cubic-bezier(0.2, 0.9, 0.1, 1)`); keep `duration-200`.
2. The keyboard path toggles instantly. In `context.svelte.ts`, inside the ⌘B
   branch, set `document.documentElement.dataset.sidebarInstant = ''` before
   calling the toggle and remove it on the next frame
   (`requestAnimationFrame(() => delete document.documentElement.dataset.sidebarInstant)`).
   In `site/src/app.css`, after the existing `@media (prefers-reduced-motion: reduce)` block:

```css
/* Keyboard toggles never animate — the result must land with the keypress. */
:root[data-sidebar-instant] [data-slot="sidebar-container"],
:root[data-sidebar-instant] [data-slot="sidebar-gap"],
:root[data-sidebar-instant] [data-slot="sidebar-rail"],
:root[data-sidebar-instant] [data-slot="sidebar-group-label"] {
  transition-duration: 0ms;
}
```

Use the `data-slot` values already present on those elements (check each file;
add `data-slot="sidebar-gap"` to the gap div at line ~70 if it has none).

**Why these values:** `--ease-snap` is the house curve; 200ms is fine for a click
once the curve is steep. 0ms on the keyboard path because the rule is
"no animation, ever" for shortcut-driven toggles — Raycast-style.

## Conventions to follow

- Easing token: `--ease-snap` in `site/src/app.css`. Do not add a curve.
- The reduced-motion block in `app.css` is the model for a global override selector — put the new rule beside it.

## Steps

1. Replace `ease-linear` → `ease-[var(--ease-snap)]` in the four sidebar files.
2. Add the `data-sidebar-instant` toggle around the shortcut call in `context.svelte.ts`.
3. Add the CSS rule to `app.css`.
4. `pnpm --filter site check`.

## Out of scope

- The mobile sheet variant of the sidebar (`sidebar.svelte` mobile branch uses `Sheet`; plan 001 covers its timing).
- Menu-button hover colors.

## Verification

**Build**
- [ ] svelte-check passes.

**Behavior**
- [ ] Click the rail / trigger on `/examples/dashboard`: sidebar animates 200ms with a fast start.
- [ ] Press ⌘B / Ctrl+B: sidebar snaps with no animation; press it ten times fast — no jitter, no mid-state.
- [ ] Reduced motion: still fine (width change is a layout tween; acceptable at 200ms, instant on keyboard).

**Feel**
- [ ] Record a click toggle at 25% speed; the width should decelerate into place, not stop dead.
