<script lang="ts">
	let { label = 'Loading example…' }: { label?: string } = $props();
</script>

<div role="status" class="mx-auto flex min-h-40 w-full max-w-md flex-col justify-center gap-5">
	<div aria-hidden="true" class="space-y-3">
		<div class="bg-rule h-2 w-1/3"></div>
		<div class="grid grid-cols-2 gap-3">
			{#each [1, 2, 3, 4] as _}
				<div class="border-rule bg-panel h-16 border sm:h-20"></div>
			{/each}
		</div>
	</div>
	<p class="text-body m-0 text-center text-sm">{label}</p>
</div>
