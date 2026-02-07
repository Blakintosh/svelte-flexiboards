<script lang="ts">
	let { children } = $props();
</script>

<div class="h-svh w-full overflow-hidden bg-background text-foreground">
	{@render children()}
</div>
