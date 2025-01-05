<script lang="ts">
	let { children } = $props();
</script>

<article class="prose mx-auto w-full py-16 dark:prose-invert lg:prose-xl">
	{@render children()}
</article>
