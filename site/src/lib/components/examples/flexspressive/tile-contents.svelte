<script module lang="ts">
	import { onMount, untrack, type Component, type Snippet } from "svelte";
    import { FlexiResize, FlexiWidget, getFlexiwidgetCtx, type FlexiWidgetProps } from "@flexiboards/svelte";
	import { getFlexspressiveEditor } from "./index.svelte";

    export type TileProps = FlexiWidgetProps & {
        title: string;
        on: boolean;
        onIcon?: any;
        offIcon?: any;
    };
</script>

<script lang="ts">
    let { title, on = $bindable(), onIcon: Icon, offIcon: OffIcon, ...props }: TileProps = $props();

    const editor = getFlexspressiveEditor();
    const widget = getFlexiwidgetCtx();

    let editMode = $derived(editor.editMode);
    let editingTile = $state(false);

    $effect(() => {
        if(!editMode) {
            untrack(() => {
                editingTile = false;

                widget.resizability = 'none';
                widget.draggability = 'movable';
            });
        }
    })

    function onclick() {
        if(!editMode) {
            on = !on;
            return;
        }
        if(editingTile) {
            return;
        }

        editingTile = true;
        widget.resizability = 'horizontal';
        widget.draggability = 'full';
    }

    let node: HTMLElement;

    function clickOutsideHandler(event: MouseEvent) {
        if(editingTile && !node.contains(event.target as Node)) {
            editingTile = false;
            widget.resizability = 'none';
            widget.draggability = 'movable';
        }
    }

    onMount(() => {
        document.addEventListener('click', clickOutsideHandler, true);

        return () => {
            document.removeEventListener('click', clickOutsideHandler, true);
        };
    })
</script>

<!--
    State is a fill, never a colour swap: on is ink, off is a tinted box, and the
    fill survives edit mode so both readings stay legible at once. The tile being
    edited takes the fx-accent dashed frame.
-->
<button class={[
    on && !editingTile && 'bg-ink text-paper',
    !on && !editingTile && 'border border-rule bg-tint text-body',
    editingTile && 'border border-dashed border-fx-accent bg-tint-accent text-fx-accent',
    widget.isShadow && 'opacity-40',
    'h-full grid place-items-center justify-items-center w-full cursor-pointer transition-colors duration-[120ms] relative'
]} {onclick} bind:this={node}>
    <span class="sr-only">Toggle {title}</span>
    <div class={[
        widget.width == 2 && "flex items-center gap-2.5 px-3 w-full",
        widget.width == 1 && "flex items-center justify-center px-3 w-full",
        "min-w-0"
        ]}>
        {#if Icon}
            <div class="size-[18px] [&>svg]:size-[18px]">
                {#if on}
                    <Icon />
                {:else}
                    <OffIcon />
                {/if}
            </div>
        {/if}
        {#if widget.width == 2}
            <h4 class="label text-[9px] truncate">{title}</h4>
        {/if}
    </div>

    <!-- Resize handle when editing tile -->
    {#if editingTile}
        <FlexiResize
            class="absolute top-[50%] right-0 translate-y-[-50%] translate-x-[50%] grid place-items-center p-2 lg:p-0"
        >
            <span class="pointer-events-none block w-1.5 h-4 bg-fx-accent"></span>
        </FlexiResize>
    {/if}
</button>
