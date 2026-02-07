<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton
			size="lg"
			class="w-full hover:bg-accent data-[state=open]:bg-accent"
		>
			<div class="flex w-full items-center gap-3">
				<Avatar.Root class="size-8 rounded-lg ring-2 ring-primary/10">
					<Avatar.Image src="https://github.com/blakintosh.png" alt="Blakintosh" />
					<Avatar.Fallback class="rounded-lg bg-primary/10 text-primary">B</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex flex-1 flex-col items-start text-left text-sm">
					<span class="font-medium">Blakintosh</span>
					<span class="text-xs text-muted-foreground">Free plan</span>
				</div>
				<ChevronsUpDown class="size-4 text-muted-foreground" />
			</div>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
