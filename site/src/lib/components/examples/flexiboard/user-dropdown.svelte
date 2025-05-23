<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton
			size="lg"
			class="flex items-center justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
		>
			<div class="flex items-center gap-4">
				<Avatar.Root class="size-8 rounded-lg border">
					<Avatar.Image src="https://github.com/blakintosh.png" alt="Blakintosh" />
					<Avatar.Fallback class="rounded-lg">B</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex flex-col gap-0.5 leading-none">
					<span class="font-semibold">Blakintosh</span>
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
