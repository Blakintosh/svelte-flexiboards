<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	// Blueprint status marks: fills mean shipped, outlines mean not yet,
	// dashes mean going away. Version numbers are plain mono, never badged.
	export const badgeVariants = tv({
		base: 'focus-visible:ring-ring/50 label inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap border border-transparent px-2 py-[3px] text-[10px] tracking-[0.1em] transition-colors duration-[120ms] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
		variants: {
			variant: {
				/* stable */
				default: 'bg-ink text-paper [a&]:hover:bg-blue [a&]:hover:text-white',
				/* preview */
				accent: 'bg-fx-accent text-white [a&]:hover:bg-fx-accent-hover',
				destructive: 'bg-fx-accent text-white [a&]:hover:bg-fx-accent-hover',
				secondary: 'bg-tint text-ink [a&]:hover:bg-rule',
				/* planned */
				outline: 'border-rule text-faint [a&]:hover:border-ink [a&]:hover:text-ink',
				/* deprecated */
				deprecated: 'border-dashed border-fx-accent text-fx-accent'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
