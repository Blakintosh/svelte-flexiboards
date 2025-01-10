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

<div>
	<h3>{title}</h3>
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Type</th>
				<th>Description</th>
			</tr>
		</thead>
		<tbody>
			{#each api as item}
				<tr>
					<td>{item.name}</td>
					<td class="break-all">{item.type}</td>
					<td>{item.description}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
