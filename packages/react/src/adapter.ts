import { effect } from "@flexiboards/core";
import { useCallback, useSyncExternalStore } from "react";

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