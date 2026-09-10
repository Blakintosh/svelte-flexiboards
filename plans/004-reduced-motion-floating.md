# 004 — Reduced motion for tw-animate surfaces and the theme icon

- **Commit:** 8070c1b
- **Severity:** MEDIUM
- **Category:** Accessibility
- **Estimated scope:** 2 files, ~15 lines

## Problem

`site/src/app.css` handles `prefers-reduced-motion` only for the `fb-*`
keyframes and `.reveal`. Every `tw-animate-css` surface (menus, popovers,
tooltip, select, sheet, drawer overlay) still slides and zooms, and the theme
toggle icons still spin from `scale-0` under `transition-all`. Reduced motion
means gentler, not zero: keep the opacity fade (it prevents a pop), drop
translation, scale and rotation.

## Where

| File                                                | Lines   | What's there                                                     |
| --------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| `site/src/app.css`                                  | 292–300 | existing `@media (prefers-reduced-motion: reduce)` block         |
| `site/src/lib/components/nav/theme-selector.svelte` | 13, 16  | `rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0` |

### Current code

```css
/* site/src/app.css:292 */
@media (prefers-reduced-motion: reduce) {
	.animate-fb-snap {
		animation: none;
		transform: translateX(calc(100% + 10px));
	}
	.animate-fb-blink {
		animation: none;
	}
	.animate-fb-rise,
	.animate-fb-in {
		animation-name: fb-fade;
		animation-delay: 0ms;
	}
	.reveal {
		transform: none;
		transition-property: opacity;
		transition-delay: 0ms;
	}
}
```

## Target

Add inside that same block:

```css
/* tw-animate surfaces: zero the transform channels, keep the opacity fade. */
.animate-in,
.animate-out {
	--tw-enter-translate-x: 0;
	--tw-enter-translate-y: 0;
	--tw-enter-scale: 1;
	--tw-enter-rotate: 0;
	--tw-exit-translate-x: 0;
	--tw-exit-translate-y: 0;
	--tw-exit-scale: 1;
	--tw-exit-rotate: 0;
}
/* Theme icon: crossfade instead of spin. */
[data-theme-icon] {
	transition-property: opacity;
	transform: none !important;
}
```

In `theme-selector.svelte`, add `data-theme-icon` to both `<Sun>` and `<Moon>`,
and replace `transition-all` with `transition-[transform,opacity] duration-[150ms] ease-[var(--ease-snap)]`
on both, adding `opacity-100 dark:opacity-0` to Sun and `opacity-0 dark:opacity-100`
to Moon so that under reduced motion the swap is a pure crossfade.

**Why these values:** the `--tw-enter-*` variables are what `tw-animate-css`'s
`enter`/`exit` keyframes read, so zeroing them removes movement without
touching duration or opacity. 150ms with `--ease-snap` for the icon keeps it
inside the hover/press band; the curve is the site's one token.

## Conventions to follow

- Keep every reduced-motion override in the single existing `@media` block in `app.css`.
- `--ease-snap` for the curve; no new token.

## Steps

1. Add the CSS to the reduced-motion block.
2. Edit `theme-selector.svelte` classes as described.
3. `pnpm --filter site check`.

## Out of scope

- Durations of the surfaces themselves (plan 003) and the sheet (plan 001).
- The hero/reveal handling already present.

## Verification

**Build**

- [ ] svelte-check passes.

**Behavior**

- [ ] DevTools → Rendering → emulate `prefers-reduced-motion: reduce`: open the theme menu and a context menu — they fade in place, no slide/zoom; the sheet fades.
- [ ] Toggle theme: Sun/Moon crossfade, no spin.
- [ ] Without emulation: everything behaves as before (icons now rotate+fade rather than scale from 0 — an improvement, nothing appears from nothing).

**Feel**

- [ ] With reduced motion on, nothing on the page moves; every state change is still visible as a fade.
