<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { cn } from '$lib/utils.js';

	type CodeExampleProps = {
		src: string;
		meta: Record<string, any>;
		example: Snippet;
		code: Snippet;
	};

	let { src, meta, example, code }: CodeExampleProps = $props();
</script>

<Tabs.Root value={'preview'} class="relative mt-4">
	<!-- <div class="flex items-center justify-between rounded-t-md px-4 py-2">
		<span class="text-base font-semibold">
			{meta?.title ?? 'Example'}
		</span>
	</div> -->
	<Tabs.List
		class="mb-8 flex h-9 items-center justify-start rounded-none border-b border-b-border bg-transparent p-0"
	>
		<Tabs.Trigger
			value="preview"
			class="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
			>Preview</Tabs.Trigger
		>
		<Tabs.Trigger
			value="code"
			class="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
			>Code</Tabs.Trigger
		>
	</Tabs.List>
	<Tabs.Content value="preview">
		<div
			class="preview mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
		>
			{@render example()}
		</div>
	</Tabs.Content>
	<Tabs.Content value="code">
		<div class="relative rounded-md">
			<pre class="max-h-[32rem]">{@render code()}</pre>
		</div>
	</Tabs.Content>
</Tabs.Root>

<!-- <div class="example">
	{@render example()}
</div>
<div class="code">
	<pre class="language-svelte">{@render code()}</pre>
</div> -->
