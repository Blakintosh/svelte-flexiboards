# Flexiboards for React

Headless, reactive drag-and-drop components for React. [https://svelte-flexiboards.vercel.app](https://svelte-flexiboards.vercel.app/)

`@flexiboards/react` is the React adapter over the framework-agnostic `@flexiboards/core`: the same boards, targets, widgets, adders and deleters as the Svelte package, with hooks (`useFlexiBoard()`, `useFlexiTarget()`, `useFlexiWidget()`, ...) in place of context getters and `onfirstcreate` callbacks in place of `bind:controller`.

If you encounter any issues, please report them on the [GitHub issues page](https://github.com/Blakintosh/svelte-flexiboards/issues).

## Installation

```
npm i @flexiboards/react
```

Requires React 18 or 19.

## Usage

```tsx
import { FlexiBoard, FlexiTarget, FlexiWidget } from "@flexiboards/react";

export function Board() {
  return (
    <FlexiBoard config={{ widgetDefaults: { draggability: "full" } }}>
      <FlexiTarget
        keyName="main"
        config={{
          layout: {
            type: "free",
            minColumns: 3,
            maxColumns: 3,
            minRows: 3,
            maxRows: 3,
          },
        }}
      >
        <FlexiWidget x={0} y={0} width={1} height={1}>
          Drag me
        </FlexiWidget>
      </FlexiTarget>
    </FlexiBoard>
  );
}
```

See the documentation site for guides and the full API reference. The React pages differ from the Svelte ones only in naming: `class` is `className`, a target's `key` is `keyName`, and snippets are children (plain JSX or a render function).

## Licence

Flexiboards is open-source software licenced under the MIT licence. Please see [LICENSE.md](https://github.com/Blakintosh/svelte-flexiboards/blob/main/LICENSE.md) for more information.
