<script module lang="ts">
	export type ApiReference = {
		name: string;
		type: string;
		description: string;
		/** Present for configuration members and component props. */
		optional?: boolean;
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
		reactApi?: ApiReference[];
	};
</script>

<script lang="ts">
	import { framework } from '$lib/components/brand/framework.svelte';
	let { title, api, reactApi }: ApiReferenceProps = $props();
	const rows = $derived(framework.current === 'react' ? (reactApi ?? api) : api);
</script>

<div class="not-prose my-8">
	<div class="border-ink bg-panel @container border">
		<!-- Explicit roles preserve table semantics when narrow layouts use block and grid. -->
		<!-- svelte-ignore a11y_no_redundant_roles -->
		<table role="table" class="@max-[32rem]:block w-full table-fixed border-collapse text-left">
			<colgroup class="@max-[32rem]:hidden"><col class="w-[52%]" /><col /></colgroup>
			<caption class="bg-paper text-ink @max-[32rem]:block px-5 py-3 text-left text-sm font-medium"
				>{title}</caption
			>
			<thead role="rowgroup" class="border-ink bg-paper @max-[32rem]:sr-only border-y">
				<tr role="row" class="label text-body text-[10px]">
					<th scope="col" class="px-5 py-2 font-medium">Name</th>
					<th scope="col" class="px-5 py-2 font-medium">Description</th>
				</tr>
			</thead>
			<tbody role="rowgroup" class="@max-[32rem]:block">
				{#each rows as item}
					<tr role="row" class="border-rule @max-[32rem]:grid border-b align-top last:border-b-0">
						<th role="rowheader" scope="row" class="px-5 py-4 font-normal">
							<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
								<code
									class="font-mono text-[13px] {item.deprecated
										? 'text-body line-through'
										: 'text-fx-accent-hover dark:text-fx-accent'}">{item.name}</code
								>
								<div class="text-body flex flex-wrap gap-x-2 text-[11px]">
									{#if item.optional !== undefined}<span
											>{item.optional ? 'Optional' : 'Required'}</span
										>{/if}
									{#if item.bindable}<span>Bindable</span>{/if}
									{#if item.readonly}<span>Readonly</span>{/if}
								</div>
							</div>
							<code
								class="text-blue mt-2 block whitespace-pre-wrap break-words font-mono text-xs leading-relaxed [overflow-wrap:anywhere]"
								>{item.type}</code
							>
						</th>
						<td
							role="cell"
							class="text-body @max-[32rem]:pt-0 px-5 py-4 text-sm leading-relaxed [overflow-wrap:anywhere]"
						>
							{#if item.description}<p class="m-0">{item.description}</p>{/if}
							{#if item.default}<p class="m-0 mt-2">Default: <code>{item.default}</code></p>{/if}
							{#if item.deprecated}<p class="m-0 mt-2">Deprecated: {item.deprecated}</p>{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
