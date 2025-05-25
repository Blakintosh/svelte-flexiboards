import type { PointerPositionWatcher } from "./utils.svelte.js";

export class FlexiKeyboardController {
    #isFocusTrapped = false;
    #moveStep: number = 20;
    #positionWatcher: PointerPositionWatcher;

    constructor(positionWatcher: PointerPositionWatcher) {
        this.#positionWatcher = positionWatcher;

        const cancelFocusChangeIfTrapped = this.#cancelFocusChangeIfTrapped.bind(this);
        const movePointer = this.#movePointer.bind(this);

        $effect(() => {
            window.addEventListener('keydown', cancelFocusChangeIfTrapped);
            window.addEventListener('keydown', movePointer);

            return () => {
                window.removeEventListener('keydown', cancelFocusChangeIfTrapped);
                window.removeEventListener('keydown', movePointer);
            }
        })
    }

    #cancelFocusChangeIfTrapped(event: KeyboardEvent) {
        if(!this.#isFocusTrapped) {
            return;
        }
        
        if(event.key === "Tab") {
            event.preventDefault();
        }
    }

    #movePointer(event: KeyboardEvent) {
        const moveStep = this.#getMoveStep(event);

        if(event.key === "ArrowUp") {
            this.#positionWatcher.updatePosition(this.#positionWatcher.position.x, this.#positionWatcher.position.y - moveStep);
            event.preventDefault();
            return;
        }

        if(event.key === "ArrowDown") {
            this.#positionWatcher.updatePosition(this.#positionWatcher.position.x, this.#positionWatcher.position.y + moveStep);
            event.preventDefault();
            return;
        }

        if(event.key === "ArrowLeft") {
            this.#positionWatcher.updatePosition(this.#positionWatcher.position.x - moveStep, this.#positionWatcher.position.y);
            event.preventDefault();
            return;
        }

        if(event.key === "ArrowRight") {
            this.#positionWatcher.updatePosition(this.#positionWatcher.position.x + moveStep, this.#positionWatcher.position.y);
            event.preventDefault();
            return;
        }
    }

    #getMoveStep(event: KeyboardEvent) {
        if(event.shiftKey) {
            return this.#moveStep * 10;
        }

        if(event.ctrlKey || event.metaKey) {
            return this.#moveStep * 0.1;
        }

        return this.#moveStep;
    }
    
}