<script lang="ts">
	import DocumentationSidebar from '$lib/components/docs/documentation-sidebar.svelte';

	let { children } = $props();
</script>

<div class="flex h-full min-h-0 gap-4">
	<aside class="hidden flex-1 flex-col gap-8 py-16 text-base lg:flex">
		<DocumentationSidebar />
	</aside>
	<article
		class="prose prose-sm mx-auto min-h-0 w-full shrink-0 overflow-y-auto py-16 dark:prose-invert lg:prose-xl"
	>
		<div class="not-prose mb-8 border px-4 py-2">
			<h2 class="text-center text-lg">Heads up! These docs are a work in progress.</h2>
		</div>
		{@render children()}
	</article>
	<div class="flex-1 flex-col gap-4">
		<!-- placeholder for when On this page is added later on. -->
	</div>
</div>
