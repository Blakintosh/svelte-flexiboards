<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
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
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-chevrons-up-down"
				><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg
			>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
