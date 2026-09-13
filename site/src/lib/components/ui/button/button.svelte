<script lang="ts" module>
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	// Blueprint: sans semibold labels, no radius, no shadow. Hover shifts fill
	// only — never scale or lift; the press answers with a 0.97 squash. One
	// accent button per screen.
	export const buttonVariants = tv({
		base: "focus-visible:ring-ring/50 aria-invalid:border-destructive ui inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-[13.5px] outline-none transition-[color,background-color,border-color,opacity,scale] duration-[130ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 motion-safe:active:scale-[0.97] [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default: 'bg-ink text-paper hover:bg-blue hover:text-white',
				destructive: 'bg-fx-accent text-white hover:bg-fx-accent-hover',
				accent: 'bg-fx-accent text-white hover:bg-fx-accent-hover',
				outline: 'border border-ink bg-transparent hover:bg-tint hover:text-ink',
				secondary: 'bg-tint text-ink hover:bg-rule',
				ghost: 'text-body hover:bg-tint hover:text-ink',
				link: 'border-b border-ink text-[13px] hover:border-fx-accent hover:text-fx-accent'
			},
			size: {
				default: 'h-11 px-5 py-3',
				sm: 'h-9 gap-1.5 px-3',
				lg: 'h-12 px-6',
				icon: 'size-9'
			}
		},
		// A quiet link is a rule under a label, not a box — so it sheds the
		// size padding whichever size it is given. Compounds apply last, after
		// the size variant, so this wins the tailwind-merge conflict.
		compoundVariants: [
			// A link is a rule under a label — it doesn't squash like a box.
			{ variant: 'link', class: 'h-auto px-0 py-0.5 active:scale-100' }
		],
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
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
		role={disabled ? 'link' : undefined}
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
