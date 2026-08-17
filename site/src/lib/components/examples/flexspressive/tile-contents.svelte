<script module lang="ts">
	import { onMount, untrack, type Component, type Snippet } from "svelte";
    import { FlexiResize, FlexiWidget, getFlexiwidgetCtx, type FlexiWidgetProps } from "svelte-flexiboards";
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

<!-- On is an ink fill, off is a tinted box; the tile being edited takes vermillion. -->
<button class={[
    on && !editMode && 'bg-ink text-paper',
    (!on || editMode) && 'border border-rule bg-tint text-body',
    editingTile && 'border border-dashed border-vermillion bg-tint-accent text-vermillion',
    widget.isShadow && 'opacity-40',
    'h-12 grid place-items-center justify-items-center w-full cursor-pointer transition-colors duration-[120ms] relative'
]} {onclick} bind:this={node}>
    <span class="sr-only">Toggle {title}</span>
    <div class={[
        widget.width == 2 && "flex items-center gap-4 px-4 w-full",
        widget.width == 1 && "flex items-center justify-center px-4 w-full",
        "min-w-0"
        ]}>
        {#if Icon}
            <div class="size-6 [&>svg]:size-6">
                {#if on}
                    <Icon />
                {:else}
                    <OffIcon />
                {/if}
            </div>
        {/if}
        {#if widget.width == 2}
            <h4 class="label text-[10px] truncate">{title}</h4>
        {/if}
    </div>

    <!-- Resize handle when editing tile -->
    {#if editingTile}
        <FlexiResize
            class="absolute top-[50%] right-0 translate-y-[-50%] translate-x-[50%] grid place-items-center p-2 lg:p-0"
        >
            <span class="pointer-events-none block w-2 h-4 bg-vermillion"></span>
        </FlexiResize>
    {/if}
</button>
