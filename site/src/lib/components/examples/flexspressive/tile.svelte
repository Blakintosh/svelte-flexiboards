<script module lang="ts">
	import type { Component, Snippet } from "svelte";
    import { FlexiWidget, type FlexiWidgetProps } from "svelte-flexiboards";

    export type TileProps = FlexiWidgetProps & {
        title: string;
        on: boolean;
        onIcon?: any;
        offIcon?: any;
    };
</script>

<script lang="ts">
    let { title, on, onIcon: Icon, offIcon: OffIcon, ...props }: TileProps = $props();
</script>

<FlexiWidget {...props} class={[
    on && 'rounded-xl bg-primary text-primary-foreground',
    !on && 'rounded-full bg-muted text-muted-foreground',
    'h-12 grid place-items-center justify-items-center'
]}>
    {#snippet children({ widget })}
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
    {/snippet}
</FlexiWidget>