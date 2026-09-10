# 003 — Popovers, menus, tooltip, select: house curve and a faster exit

- **Commit:** 8070c1b
- **Severity:** MEDIUM
- **Category:** Cohesion, hierarchy & spatial consistency (plus Easing)
- **Estimated scope:** 7 files, 1 class-string edit each

## Problem

Every floating surface (dropdown menu, context menu, popover, tooltip, select)
uses `tw-animate-css` defaults: built-in `ease` at 150ms for both enter and exit.
Built-in curves accelerate too weakly, so the pop-in feels flat next to the
site's own `--ease-snap` motion, and a symmetric exit is a second thing to watch
after the user already decided. Origins are already correct
(`origin-(--bits-*-transform-origin)`), so this is timing only.

## Where

| File                                                                        | Line | What's there                                  |
| --------------------------------------------------------------------------- | ---- | --------------------------------------------- |
| `site/src/lib/components/ui/dropdown-menu/dropdown-menu-content.svelte`     | 22   | `data-[state=open]:animate-in … zoom-in-95 …` |
| `site/src/lib/components/ui/dropdown-menu/dropdown-menu-sub-content.svelte` | 16   | same                                          |
| `site/src/lib/components/ui/context-menu/context-menu-content.svelte`       | 20   | same                                          |
| `site/src/lib/components/ui/context-menu/context-menu-sub-content.svelte`   | 16   | same                                          |
| `site/src/lib/components/ui/popover/popover-content.svelte`                 | 24   | same                                          |
| `site/src/lib/components/ui/tooltip/tooltip-content.svelte`                 | 25   | `animate-in fade-in-0 zoom-in-95 …`           |
| `site/src/lib/components/ui/select/select-content.svelte`                   | 30   | `duration-100 … data-open:animate-in …`       |

### Current code (dropdown, representative)

```ts
// dropdown-menu-content.svelte:22
'… data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 … origin-(--radix-dropdown-menu-content-transform-origin) …';
```

## Target

Append to each class string (do not remove existing classes):

```
ease-[var(--ease-snap)] data-[state=open]:duration-160 data-[state=closed]:duration-100
```

For `select-content.svelte` the state attributes are `data-open` / `data-closed`;
replace its existing `duration-100` with
`ease-[var(--ease-snap)] data-open:duration-160 data-closed:duration-100`.
For `tooltip-content.svelte` (open state is unconditional): `ease-[var(--ease-snap)] duration-160 data-[state=closed]:duration-100`.

**Why these values:** `--ease-snap` = `cubic-bezier(0.2, 0.9, 0.1, 1)`, the only
curve on the site. 160ms is inside the 150–250ms band for menus and matches the
120–140ms hover transitions in feel. 100ms exit is ~40% shorter, opacity + a
small zoom-out is all it needs. `zoom-in-95` already starts near-full; keep it —
never from `scale(0)`.

## Conventions to follow

- `site/src/lib/components/brand/framework-picker.svelte` uses `ease-snap`/`duration-[140ms]` — same token.
- These are shadcn-svelte generated files: edit the class string only, keep structure.

## Steps

1. Edit the seven class strings.
2. `pnpm --filter site check`.
3. Open the theme selector (header), a context menu on `/examples/notes`, the select in `/examples/products`.

## Out of scope

- Sheet / drawer (plan 001).
- Item hover colors, stagger (there is none — correct; do not add one).

## Verification

**Build**

- [ ] svelte-check passes.

**Behavior**

- [ ] Menus still scale from the trigger side, not the center.
- [ ] Open/close rapidly: no lingering ghost — exit is clearly the quicker of the two.

**Feel**

- [ ] Scrub the theme dropdown at 25%: fast pop, soft settle. If enter and exit look the same length, the `data-[state=closed]` duration didn't apply — inspect `--tw-duration`.
