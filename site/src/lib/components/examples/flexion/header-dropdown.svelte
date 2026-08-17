<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton
			size="lg"
			class="flex items-center justify-between data-[state=open]:bg-tint data-[state=open]:text-ink"
		>
			<div class="flex items-center gap-4">
				<div
					class="flex aspect-square size-8 items-center justify-center bg-ink font-mono text-paper"
				>
					A
				</div>
				<div class="flex flex-col gap-0.5 leading-none">
					<span class="font-serif text-ink">Acme Inc.</span>
				</div>
			</div>
			<ChevronsUpDown />
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
