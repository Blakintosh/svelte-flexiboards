import { useEffect, useRef } from "react";

/**
 * Creates a single ref, for controllers, that automatically handles garbage collection.
 * @param create The function that constructs the single object.
 * @returns The value of the object.
 */
export function useSingleRef<T extends { destroy(): void }>(create: () => T): T {
    const singleRef = useRef<T | null>(null);
    singleRef.current ??= create();
    
    useEffect(() => {
        // in strict-mode, re-create if it's been destroyed.
        const single = (singleRef.current ??= create());
        return () => single.destroy();
    }, []);

    return singleRef.current;
}

/**
 * Runs the fn exactly once per component, even in StrictMode remounts.
 * @param fn The function to run.
 */
export function useOnce(fn: () => void) {
    const ran = useRef(false);
    if(!ran.current) {
        ran.current = true;
        fn();
    }
}