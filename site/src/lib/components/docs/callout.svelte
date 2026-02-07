<script module lang="ts">
	import type { Snippet } from 'svelte';

	export type CalloutVariant = 'info' | 'tip' | 'warning' | 'danger' | 'note';

	export type CalloutProps = {
		variant?: CalloutVariant;
		title?: string;
		children: Snippet;
	};
</script>

<script lang="ts">
	import { Info, Lightbulb, AlertTriangle, AlertCircle, FileText } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let { variant = 'info', title, children }: CalloutProps = $props();

	const config = {
		info: {
			icon: Info,
			title: 'Info',
			classes: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
			iconClass: 'text-blue-500'
		},
		tip: {
			icon: Lightbulb,
			title: 'Tip',
			classes: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
			iconClass: 'text-green-500'
		},
		warning: {
			icon: AlertTriangle,
			title: 'Warning',
			classes: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
			iconClass: 'text-yellow-500'
		},
		danger: {
			icon: AlertCircle,
			title: 'Danger',
			classes: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
			iconClass: 'text-red-500'
		},
		note: {
			icon: FileText,
			title: 'Note',
			classes: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
			iconClass: 'text-muted-foreground'
		}
	};

	const current = $derived(config[variant]);
	const displayTitle = $derived(title ?? current.title);
</script>

<div class={cn('not-prose my-6 flex gap-3 rounded-lg border p-4', current.classes)}>
	<current.icon class={cn('mt-0.5 size-5 shrink-0', current.iconClass)} />
	<div class="flex flex-col gap-1">
		<span class="text-sm font-semibold">{displayTitle}</span>
		<div class="text-sm opacity-90 space-y-2">
			{@render children()}
		</div>
	</div>
</div>
