<script lang="ts">
	import { cn } from "$lib/utils";
    import { Slider } from "bits-ui";
    import SunMedium from "lucide-svelte/icons/sun-medium";

    let value = $state(80);
</script>

<div class="w-full">
    <Slider.Root
        type="single"
        bind:value
        class="relative flex w-full touch-none select-none items-center my-6"
    >
        <span
        class="bg-muted relative h-7 w-full grow cursor-pointer overflow-hidden rounded-sm"
        >
            <Slider.Range class="bg-foreground absolute h-full" />
            <span class="absolute left-0 top-0 text-background p-1">
                <SunMedium class="size-5" />
            </span>
        </span>
        <Slider.Thumb
        index={0}
        class={cn(
            "border-border-input bg-background hover:border-dark-40 focus-visible:ring-foreground dark:bg-foreground dark:shadow-card data-active:border-dark-40 focus-visible:outline-hidden data-active:scale-[0.98] block h-9 w-2 cursor-pointer rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        )}
        />
    </Slider.Root>
</div>