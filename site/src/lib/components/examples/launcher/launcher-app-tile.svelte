<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';
	import { APPS } from './apps.js';

	// The widget's identity travels in its metadata, so it survives export / import.
	const widget = getFlexiwidgetCtx();
	const key = $derived((widget.metadata?.app as string | undefined) ?? 'mail');
	const app = $derived(APPS[key] ?? APPS.mail);
	const Icon = $derived(app.icon);
</script>

<!--
	The tile label uses the mono/uppercase label voice with tighter tracking than the
	`label` utility: at the sm breakpoint a cell is 64px, and 0.14em would clip
	"Settings" and "Messages".
-->
<div class="flex h-full w-full flex-col items-center justify-center gap-1.5 overflow-hidden px-0.5">
	<Icon class="text-blue size-6 lg:size-7" />
	<span
		class="text-faint max-w-full truncate font-mono text-[9px] font-medium tracking-[0.06em] uppercase"
		>{app.label}</span
	>
</div>
