<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';
	import { APPS } from './apps.js';

	// The widget's identity travels in its metadata, so it survives export / import.
	const widget = getFlexiwidgetCtx();
	const key = $derived((widget.metadata?.app as string | undefined) ?? 'mail');
	const app = $derived(APPS[key] ?? APPS.mail);
	const Icon = $derived(app.icon);
</script>

<!-- Sentence-case caption under the glyph, sized to survive a 64px sm cell. -->
<div class="flex h-full w-full flex-col items-center justify-center gap-1.5 overflow-hidden px-0.5">
	<Icon class="text-blue size-6 lg:size-7" />
	<span class="text-faint max-w-full truncate text-[10px] font-semibold">{app.label}</span>
</div>
