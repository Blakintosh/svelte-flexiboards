<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton size="lg" class="hover:bg-tint data-[state=open]:bg-tint w-full">
			<div class="flex w-full items-center gap-3">
				<Avatar.Root class="border-rule size-8 border">
					<Avatar.Image src="https://github.com/blakintosh.png" alt="Blakintosh" />
					<Avatar.Fallback class="bg-tint text-ink font-mono">B</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex flex-1 flex-col items-start text-left">
					<span class="text-ink text-[13px]">Blakintosh</span>
					<span class="label text-faint text-[10px]">Free plan</span>
				</div>
				<ChevronsUpDown class="text-faint size-4" />
			</div>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
