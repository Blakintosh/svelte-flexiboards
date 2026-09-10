# 001 — Give the Sheet a steep ease-out and a shorter exit

- **Commit:** 8070c1b
- **Severity:** HIGH
- **Category:** Easing & duration
- **Estimated scope:** 1 file, ~3 lines

## Problem

The side/bottom sheet used by the example apps (products, notes, dashboard) enters
over 500ms and exits over 300ms with `ease-in-out`. An entrance must be
`ease-out`: the slow start of an in-out curve delays the exact moment the user is
watching, so the sheet reads as hesitant, and the exit uses the same curve family
instead of being faster and simpler than the entry. The 500ms only works with a
curve that front-loads the movement (Vaul's), which this is not.

## Where

| File                                                    | Lines | What's there                              |
| ------------------------------------------------------- | ----- | ----------------------------------------- |
| `site/src/lib/components/ui/sheet/sheet-content.svelte` | 4     | `base` class string of the sheet variants |

### Current code

```ts
// site/src/lib/components/ui/sheet/sheet-content.svelte:4
base: "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
```

## Target

```ts
base: "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 ease-[var(--ease-snap)] data-[state=open]:duration-400 data-[state=closed]:duration-250",
```

`tw-animate-css` reads `--tw-ease` and `--tw-duration`, which Tailwind v4's `ease-*`
and `duration-*` utilities set, so the keyframe animation picks these up.

**Why these values:** `--ease-snap` = `cubic-bezier(0.2, 0.9, 0.1, 1)` is the
site's one steep ease-out token (`site/src/app.css`, `--ease-snap`); a steep curve
earns a longer duration, so 400ms open stays lively. 250ms close is ~40% shorter
than the entry — the user already decided, get out of the way. `transition` is
removed: it transitioned every property for no reason and could fight the
animation.

## Conventions to follow

- Easing tokens live in `site/src/app.css` under `@theme` — use `--ease-snap`; do not add a new curve.
- `site/src/lib/components/brand/framework-picker.svelte` already uses `ease-snap` as a Tailwind class on a transition — same token, same spelling.

## Steps

1. Replace the `base` string at line 4 exactly as shown in Target.
2. Run `pnpm --filter site check` (svelte-check).
3. Open `/examples/products` on desktop, open and close the sheet several times.

## Out of scope

- The `side` variants on lines 7–10 (slide directions are correct).
- `drawer-content.svelte` (Vaul manages its own motion).
- Any other popover/menu timing — that is plan 003.

## Verification

**Build**

- [ ] svelte-check passes.

**Behavior**

- [ ] Sheet still slides from its configured side; overlay still fades.
- [ ] Close feels quicker than open.
- [ ] With `prefers-reduced-motion: reduce` emulated, motion is opacity-only (plan 004 supplies this; before it lands, expect the slide).

**Feel**

- [ ] Record open at 25% speed: fast start, gentle settle. If it looks flat, the class did not apply (check `--tw-ease` in DevTools), not the duration.
- [ ] Test on a phone by local IP — bottom sheets read differently on touch.
