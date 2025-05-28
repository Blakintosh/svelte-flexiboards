<script lang="ts">
	import type { Snippet } from "svelte";

    type HeadsUpProps = {
        children: Snippet;
        title?: string;
    };

    let {
        children,
        title
    }: HeadsUpProps = $props();
</script>

<div class="text-base rounded-lg bg-red-500/10 font-normal overflow-clip flex items-stretch gap-4 text-foreground my-4">
    <div class="w-1 shrink-0 bg-red-500"></div>
    <div class="grow py-4 prose-base">
        {#if title}
            <h4 class="not-prose font-semibold mb-2 uppercase text-foreground block">{title}</h4>
        {/if}
        {@render children()}
    </div>
</div>