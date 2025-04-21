<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Tabs from '$lib/components/ui/tabs';

	type CodeExampleProps = {
		src: string;
		meta: Record<string, any>;
		example: Snippet;
		code: Snippet;
	};

	let { src, meta, example, code }: CodeExampleProps = $props();
</script>

<Tabs.Root value={'preview'}>
	<div class="flex items-center justify-between rounded-t-md bg-muted px-4 text-base font-semibold">
		<span>
			{meta?.title ?? 'Example'}
		</span>
		<Tabs.List>
			<Tabs.Trigger value="preview">Preview</Tabs.Trigger>
			<Tabs.Trigger value="code">Code</Tabs.Trigger>
		</Tabs.List>
	</div>
	<div class="grid place-items-center rounded-b-md border px-8 py-4">
		<Tabs.Content value="preview">
			<div class="preview">
				{@render example()}
			</div>
		</Tabs.Content>
		<Tabs.Content value="code">
			<pre class="language-svelte">{@render code()}</pre>
		</Tabs.Content>
	</div>
</Tabs.Root>

<!-- <div class="example">
	{@render example()}
</div>
<div class="code">
	<pre class="language-svelte">{@render code()}</pre>
</div> -->
