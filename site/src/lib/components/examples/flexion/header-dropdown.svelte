<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton
			size="lg"
			class="flex items-center justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
		>
			<div class="flex items-center gap-4">
				<div
					class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
				>
					A
				</div>
				<div class="flex flex-col gap-0.5 leading-none">
					<span class="font-semibold">Acme Inc.</span>
				</div>
			</div>
			<ChevronsUpDown />
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
