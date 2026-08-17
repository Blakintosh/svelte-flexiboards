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

<!--
  API tables are rules only — no zebra striping, no radius. Prop names take
  vermillion, types drafting blue, prose the body grey.
-->
<div class="not-prose my-8">
	<h3 class="label mb-3 text-[10px] text-faint" data-toc-ignore>
		{title}
	</h3>
	<div class="border border-ink bg-panel">
		<div class="flex gap-6 border-b border-ink bg-paper px-5 py-2">
			<span class="label w-1/3 text-[10px] text-faint">Prop</span>
			<span class="label flex-1 text-[10px] text-faint">Type</span>
		</div>
		{#each api as item}
			<div class="flex flex-col gap-2 border-b border-rule px-5 py-4 last:border-b-0">
				<div class="flex flex-wrap items-baseline gap-x-6 gap-y-1">
					<code class="w-1/3 min-w-fit font-mono text-[13px] text-vermillion">{item.name}</code>
					<code class="flex-1 font-mono text-[12.5px] text-blue">{item.type}</code>
				</div>
				<p class="m-0 text-[14px] leading-relaxed text-body">{item.description}</p>
			</div>
		{/each}
	</div>
</div>
