<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton size="lg" class="w-full hover:bg-tint data-[state=open]:bg-tint">
			<div class="flex w-full items-center gap-3">
				<Avatar.Root class="size-8 border border-rule">
					<Avatar.Image src="https://github.com/blakintosh.png" alt="Blakintosh" />
					<Avatar.Fallback class="bg-tint font-mono text-ink">B</Avatar.Fallback>
				</Avatar.Root>
				<div class="flex flex-1 flex-col items-start text-left">
					<span class="text-[13px] text-ink">Blakintosh</span>
					<span class="label text-[10px] text-faint">Free plan</span>
				</div>
				<ChevronsUpDown class="size-4 text-faint" />
			</div>
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
