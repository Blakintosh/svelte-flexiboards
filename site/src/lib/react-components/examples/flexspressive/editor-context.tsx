import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * React twin of `examples/flexspressive/index.svelte.ts`: the Svelte version is
 * a `$state` class put on Svelte context; here it's a context value plus a
 * setter, provided by the page and read by every tile.
 */
export type FlexspressiveEditor = {
	editMode: boolean;
	setEditMode: (editMode: boolean) => void;
};

const FlexspressiveEditorContext = createContext<FlexspressiveEditor | null>(null);

export function FlexspressiveEditorProvider({ children }: { children: ReactNode }) {
	const [editMode, setEditMode] = useState(false);
	const value = useMemo(() => ({ editMode, setEditMode }), [editMode]);

	return (
		<FlexspressiveEditorContext.Provider value={value}>
			{children}
		</FlexspressiveEditorContext.Provider>
	);
}

export function useFlexspressiveEditor() {
	const editor = useContext(FlexspressiveEditorContext);

	if (!editor) {
		throw new Error('useFlexspressiveEditor() must be used inside a FlexspressiveEditorProvider.');
	}

	return editor;
}
