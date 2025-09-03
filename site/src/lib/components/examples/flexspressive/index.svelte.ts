import { getContext, setContext } from "svelte";

export class FlexspressiveEditor {
    editMode: boolean = $state(false);
}

const contextKey = Symbol('flexspressiveEditor');

export function createFlexspressiveEditor() {
    const editor: FlexspressiveEditor = new FlexspressiveEditor();

    setContext(contextKey, editor);
    return editor;
}

export function getFlexspressiveEditor() {
    return getContext<FlexspressiveEditor>(contextKey);
}