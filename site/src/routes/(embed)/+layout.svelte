<script lang="ts">
	let { children } = $props();
</script>

<!-- Embeds are the rendered result, framed by the page that hosts them: paper ground, no chrome of their own. -->
<div class="h-svh w-full overflow-hidden bg-paper text-ink">
	{@render children()}
</div>
