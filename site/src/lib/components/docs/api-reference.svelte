<script module lang="ts">
	export type ApiReference = {
		name: string;
		type: string;
		description: string;
		/** Deprecation notice, when the member is deprecated. */
		deprecated?: string;
		/** Default value, when one is documented. */
		default?: string;
		/** Svelte props: whether the prop supports bind:. */
		bindable?: boolean;
		/** Controller members: whether the property is read-only. */
		readonly?: boolean;
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
  fx-accent, types drafting blue, prose the body grey. Deprecated members are
  greyed out with their notice flagged fx-accent.
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
					<span class="flex w-1/3 min-w-fit items-baseline gap-2">
						<code
							class="font-mono text-[13px] {item.deprecated
								? 'text-faint line-through'
								: 'text-fx-accent'}">{item.name}</code
						>
						{#if item.bindable}
							<span class="label border border-rule px-1 py-px text-[9px] text-faint">bindable</span>
						{/if}
						{#if item.readonly}
							<span class="label border border-rule px-1 py-px text-[9px] text-faint">readonly</span>
						{/if}
					</span>
					<code class="flex-1 font-mono text-[12.5px] text-blue">{item.type}</code>
				</div>
				{#if item.description}
					<p class="m-0 text-[14px] leading-relaxed text-body">{item.description}</p>
				{/if}
				{#if item.default}
					<p class="m-0 font-mono text-[12px] text-faint">
						Default: <code class="text-body">{item.default}</code>
					</p>
				{/if}
				{#if item.deprecated}
					<p class="m-0 text-[13px] leading-relaxed text-body">
						<span class="label mr-1.5 text-[9px] text-fx-accent">Deprecated</span>{item.deprecated}
					</p>
				{/if}
			</div>
		{/each}
	</div>
</div>
