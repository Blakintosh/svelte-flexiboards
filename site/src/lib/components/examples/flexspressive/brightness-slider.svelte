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
        class="relative flex w-full touch-none select-none items-center mt-2.5 mb-1.5"
    >
        <!-- A measurement, so it reads as a drawn gauge: ink fill in a ruled trough. -->
        <span class="relative h-[26px] w-full grow cursor-pointer overflow-hidden border border-rule bg-tint">
            <Slider.Range class="bg-ink absolute h-full" />
            <span class="absolute left-0 top-0 text-paper p-[5px]">
                <SunMedium class="size-4" />
            </span>
        </span>
        <Slider.Thumb
        index={0}
        class={cn(
            "focus-visible:ring-fx-accent focus-visible:outline-hidden block h-9 w-1.5 cursor-pointer bg-fx-accent transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        )}
        />
    </Slider.Root>
</div>