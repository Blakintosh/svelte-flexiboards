<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { ButtonSize, ButtonVariant } from './button-classes.js';

	/** Example-only button: plain <button> on the site's variant classes. */
	type ButtonProps = HTMLButtonAttributes & {
		variant?: ButtonVariant;
		size?: ButtonSize;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { buttonClass } from './button-classes.js';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		type = 'button',
		children,
		...rest
	}: ButtonProps = $props();
</script>

<button class={cn(buttonClass(variant, size), className)} {type} {...rest}>
	{@render children?.()}
</button>
