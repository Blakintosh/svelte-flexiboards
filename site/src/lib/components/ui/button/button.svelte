<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	// Blueprint: uppercase mono labels, no radius, no shadow. Hover shifts fill
	// only — never scale or lift. One accent button per screen.
	export const buttonVariants = tv({
		base: "focus-visible:ring-ring/50 aria-invalid:border-destructive label inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-[13px] outline-none transition-colors duration-[120ms] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default: "bg-ink text-paper hover:bg-blue hover:text-white",
				destructive: "bg-vermillion text-white hover:bg-vermillion-hover",
				accent: "bg-vermillion text-white hover:bg-vermillion-hover",
				outline: "border border-ink bg-transparent hover:bg-tint hover:text-ink",
				secondary: "bg-tint text-ink hover:bg-rule",
				ghost: "text-body hover:bg-tint hover:text-ink",
				link: "border-b border-ink tracking-[0.1em] hover:border-vermillion hover:text-vermillion",
			},
			size: {
				default: "h-11 px-5 py-3",
				sm: "h-9 gap-1.5 px-3",
				lg: "h-12 px-6",
				icon: "size-9",
			},
		},
		// A quiet link is a rule under a label, not a box — so it sheds the
		// size padding whichever size it is given. Compounds apply last, after
		// the size variant, so this wins the tailwind-merge conflict.
		compoundVariants: [
			{ variant: "link", class: "h-auto px-0 py-0.5" },
		],
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
