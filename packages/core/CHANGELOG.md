# @flexiboards/core

## 1.0.0

Initial release of the shared grid engine, split from `svelte-flexiboards`.

- Free-form and flow grids, responsive layouts, widget registries, and versioned layout envelopes.
- Controller actions and board callbacks, including drop validation and layout change notifications after committed mutations.
- Late widget declarations use normal placement rules. Destination placeholders measure final card sizes before drop flights.
- CSS transitions use sine in-out reordering and circ-out drops. The deprecated simple preset retains its original 150ms timing. Springs remain stable across frame rates.
- Accessibility row ownership, one-based spoken positions, cancellation announcements, and focus preservation during dragging and cross-target drops.
