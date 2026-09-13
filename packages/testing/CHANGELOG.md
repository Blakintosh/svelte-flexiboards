# @flexiboards/testing

## 1.0.0

Initial DOM testing helpers for both adapters.

- Geometry and ResizeObserver mocks for happy-dom and jsdom, keyboard and pointer gestures, and controllable animation frames.
- `layoutGrid()` and `cellAt()` translate one-based ARIA indices to zero-based model coordinates.
- `cells()` selects widget elements, including the drag preview; `realCells()` excludes previews. These helpers also find a grabbed widget while its role temporarily changes from gridcell to group.
