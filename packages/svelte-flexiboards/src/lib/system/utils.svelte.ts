
/*
    This MousePosition utility class is inspired by the MousePositionState class from Joy of Code's
    'Creating Reactive Browser APIs In Svelte' video, found at https://youtu.be/BKyENJQ6KdQ.
*/

import { getContext, setContext } from "svelte";
import type { Position } from "./types.js";
import type { FlexiWidget } from "./widget.svelte.js";

export class PointerPositionWatcher {
    #position: Position = $state({
        x: 0,
        y: 0
    });
    #ref: { ref: HTMLElement | null } = $state({
        ref: null
    });

    constructor(ref: { ref: HTMLElement | null }) {
        this.#ref = ref;

        const onPointerMove = (event: PointerEvent) => {    
            if(!this.#ref.ref) {
                return;
            }

            const rect = this.#ref.ref.getBoundingClientRect();

            this.#position.x = event.clientX - rect.left;
            this.#position.y = event.clientY - rect.top;

            event.preventDefault();
        };

        $effect(() => {
            window.addEventListener('pointermove', onPointerMove);

            return () => {
                window.removeEventListener('pointermove', onPointerMove);
            };
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