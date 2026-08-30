<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import UserDropdown from './user-dropdown.svelte';

	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import ArrowRightLeft from 'lucide-svelte/icons/arrow-right-left';
	import ChartArea from 'lucide-svelte/icons/chart-area';
	import Layers from 'lucide-svelte/icons/layers';
</script>

<Sidebar.Root class="border-rule bg-paper absolute h-full border-r">
	<Sidebar.Header class="border-rule border-b px-2 py-4">
		<div class="flex items-center gap-3 px-2">
			<div class="bg-ink text-paper flex size-8 items-center justify-center">
				<Layers class="size-4" />
			</div>
			<div class="flex flex-col">
				<span class="text-ink font-serif text-sm">Flexiboard</span>
				<!-- The tenant, not the page: the sheet's fig band already names the view. -->
				<span class="label text-faint text-[10px]">Acme Analytics</span>
			</div>
		</div>
	</Sidebar.Header>

	<!-- One group, three destinations. The demo is the board, not the nav. -->
	<Sidebar.Content class="px-2 py-4">
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="border-fx-accent bg-tint text-ink border-l-2">
							<LayoutDashboard class="size-4" />
							<span>Overview</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-body hover:bg-tint hover:text-ink">
							<ArrowRightLeft class="size-4" />
							<span>Transactions</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-body hover:bg-tint hover:text-ink">
							<ChartArea class="size-4" />
							<span>Reports</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer class="border-rule border-t p-2">
		<UserDropdown />
	</Sidebar.Footer>
</Sidebar.Root>
