import { effect } from "@flexiboards/core";
import { useCallback, useSyncExternalStore, type CSSProperties } from "react";

/**
 * Wraps a read of core signal-backed state so that React component
 * reading it re-renders when the underlying core signal changes.
 *
 * The `read` function must actually read the reactive value (call signals,
 * touch getters) — tracking happens at read time, not at reference time.
 */
export function useFromCore<T>(read: () => T): T {
    const subscribe = useCallback(
        (notify: () => void) =>
            effect(() => {
                read();      // establish tracking
                notify();    // tell React to re-read the snapshot
            }),
        [read]
    );

    return useSyncExternalStore(subscribe, read, read);
}

/**
 * Given a CSS style string, converts it to a CSSProperties object compatible
 * with the React style prop.
 * @param css The CSS string.
 */
export function parseStyleString(css: string): CSSProperties {
    const out: Record<string, string> = {};

    for(const decl of css.split(';')) {
        const i = decl.indexOf(':');
        if(i === -1) {
            continue;
        }

        const prop = decl.slice(0, i).trim();
        // Normalise prop names to camelCase.
        const key = prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

        out[key] = decl.slice(i + 1).trim();
    }

    return out as CSSProperties;
}