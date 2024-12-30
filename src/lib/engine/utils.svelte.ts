
/*
    This MousePosition utility class is inspired by the MousePositionState class from Joy of Code's
    'Creating Reactive Browser APIs In Svelte' video, found at https://youtu.be/BKyENJQ6KdQ.
*/

import { getContext, setContext } from "svelte";
import type { MousePosition } from "./types.js";
import type { FlexiWidget } from "./widget.svelte.js";

export class MousePositionWatcher {
    #position: MousePosition = $state({
        x: 0,
        y: 0
    });
    #ref: { ref: HTMLElement | null } = $state();

    constructor(ref: { ref: HTMLElement | null }) {
        this.#ref = ref;

        const onMouseMove = (event: MouseEvent) => {    
            if(!this.#ref.ref) {
                return;
            }

            const rect = this.#ref.ref.getBoundingClientRect();

            this.#position.x = event.clientX - rect.left;
            this.#position.y = event.clientY - rect.top;
        };

        $effect(() => {
            window.addEventListener('mousemove', onMouseMove);

            return () => window.removeEventListener('mousemove', onMouseMove);
        });
    }

    get position() {
        return this.#position;
    }
}


const contextKey = Symbol('flexiwidgetwrapper');

export function flexiwidgetwrapper(widget: FlexiWidget) {
    setContext(contextKey, widget);
}

export function getFlexiwidgetwrapperCtx() {
    return getContext<FlexiWidget | undefined>(contextKey);
}