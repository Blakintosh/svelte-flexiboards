---
'@flexiboards/core': minor
'@flexiboards/react': minor
'@flexiboards/svelte': minor
---

Allow FlexiWidget declarations to mount after a target has loaded. Late additions use the existing grid placement rules, fire onfirstcreate when accepted, and report the updated layout. React registers late widgets after commit so suspended renders and StrictMode do not create duplicates.

Declarations still register once per mount. Removing a declaration does not delete its controller; use widget.delete() to remove it from the board.
