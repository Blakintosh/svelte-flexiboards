<script module lang="ts">
	export type ApiReference = {
		name: string;
		type: string;
		description: string;
	};

	export type ApiReferenceProps = {
		title: string;
		api: ApiReference[];
	};
</script>

<script lang="ts">
	let { title, api }: ApiReferenceProps = $props();
</script>

<div class="not-prose my-6">
	<h3
		class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
		data-toc-ignore
	>
		{title}
	</h3>
	<div class="overflow-hidden rounded-lg border bg-card">
		{#each api as item, i}
			<div
				class="group flex flex-col gap-2 border-b px-5 py-4 last:border-b-0 hover:bg-muted/50 transition-colors"
			>
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<code class="text-sm font-semibold text-foreground">{item.name}</code>
					<code class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
						>{item.type}</code
					>
				</div>
				<p class="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
			</div>
		{/each}
	</div>
</div>
