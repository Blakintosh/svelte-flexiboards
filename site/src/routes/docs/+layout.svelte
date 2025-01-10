<script lang="ts">
	import DocumentationSidebar from '$lib/components/docs/documentation-sidebar.svelte';

	let { children } = $props();
</script>

<div class="flex h-full min-h-0 gap-4">
	<DocumentationSidebar />
	<article
		class="prose mx-auto min-h-0 w-full shrink-0 overflow-y-auto py-16 dark:prose-invert lg:prose-xl"
	>
		{@render children()}
	</article>
	<div class="flex-1 flex-col gap-4">
		<!-- placeholder for when On this page is added later on. -->
	</div>
</div>
