<script lang="ts">
	import { cn } from '$lib/utils';
	import { Slider } from 'bits-ui';
	import SunMedium from 'lucide-svelte/icons/sun-medium';

	let value = $state(80);
</script>

<div class="w-full">
	<Slider.Root
		type="single"
		bind:value
		class="relative mb-1.5 mt-2.5 flex w-full touch-none select-none items-center"
	>
		<!-- A gauge, softened into a pill: ink fill in a rounded trough. -->
		<span
			class="border-rule-soft bg-tint relative h-[26px] w-full grow cursor-pointer overflow-hidden rounded-full border"
		>
			<Slider.Range class="bg-ink absolute h-full" />
			<span class="text-paper absolute left-0 top-0 p-[5px]">
				<SunMedium class="size-4" />
			</span>
		</span>
		<Slider.Thumb
			index={0}
			class={cn(
				'focus-visible:ring-fx-accent focus-visible:outline-hidden bg-fx-accent block h-9 w-2 cursor-pointer rounded-full transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
			)}
		/>
	</Slider.Root>
</div>
