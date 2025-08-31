<script module lang="ts">
	import { untrack, type Component, type Snippet } from "svelte";
    import { FlexiResize, FlexiWidget, type FlexiWidgetProps } from "svelte-flexiboards";
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

    let editMode = $derived(editor.editMode);
    let editingTile = $state(false);

    $effect(() => {
        if(!editMode) {
            untrack(() => editingTile = false);
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
    }
</script>

<FlexiWidget {...props} draggable={editingTile} resizability={editingTile ? 'horizontal' : 'none'}>
    {#snippet children({ widget })}
        <button class={[
            on && !editMode && 'rounded-xl bg-primary text-primary-foreground',
            (!on || editMode) && 'rounded-full bg-muted text-muted-foreground',
            editingTile && 'outline-2 outline-primary',
            'h-12 grid place-items-center justify-items-center w-full cursor-pointer transition-all duration-150 relative'
        ]} {onclick}>
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
    {/snippet}
</FlexiWidget>