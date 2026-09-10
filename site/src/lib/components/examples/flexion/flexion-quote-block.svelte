<script lang="ts">
	let { label, content }: { label?: string; content?: string } = $props();
</script>

<!-- A note callout: 2px blue rule, tinted ground, softly rounded, never italic. -->
<blockquote
	class="border-blue bg-tint text-body max-w-[68ch] rounded-[10px] border-l-2 px-4 py-3 text-[13px] leading-relaxed lg:text-[13.5px]"
>
	{#if label}<strong class="text-ink">{label}</strong>{/if}
	{content}
</blockquote>
