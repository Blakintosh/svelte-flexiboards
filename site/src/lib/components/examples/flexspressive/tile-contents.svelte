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

    $inspect(editMode);

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

<button class={[
    on && !editMode && 'rounded-xl bg-primary text-primary-foreground',
    (!on || editMode) && 'rounded-full bg-muted text-muted-foreground',
    editingTile && 'outline-2 outline-primary',
    widget.isShadow && 'opacity-40',
    'h-12 grid place-items-center justify-items-center w-full cursor-pointer transition-all duration-150 relative'
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
            <h4 class="text-sm font-semibold truncate">{title}</h4>
        {/if}
    </div>

    <!-- Resize handle when editing tile -->
    {#if editingTile}
        <FlexiResize class="absolute top-[50%] right-0 translate-y-[-50%] w-2 h-4 bg-primary rounded-lg translate-x-[50%]">

        </FlexiResize>
    {/if}
</button>