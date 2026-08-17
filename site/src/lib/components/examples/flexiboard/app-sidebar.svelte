<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import UserDropdown from './user-dropdown.svelte';

	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import ArrowRightLeft from 'lucide-svelte/icons/arrow-right-left';
	import ChartArea from 'lucide-svelte/icons/chart-area';
	import Bell from 'lucide-svelte/icons/bell';
	import Plus from 'lucide-svelte/icons/plus';
	import Settings from 'lucide-svelte/icons/settings';
	import Layers from 'lucide-svelte/icons/layers';
</script>

<Sidebar.Root class="absolute h-full border-r border-rule bg-paper">
	<Sidebar.Header class="border-b border-rule px-2 py-4">
		<div class="flex items-center gap-3 px-2">
			<div class="flex size-8 items-center justify-center bg-ink text-paper">
				<Layers class="size-4" />
			</div>
			<div class="flex flex-col">
				<span class="font-serif text-sm text-ink">Flexiboard</span>
				<span class="label text-[10px] text-faint">Dashboard</span>
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="px-2 py-4">
		<!-- Quick actions -->
		<Sidebar.Group>
			<Sidebar.GroupLabel class="label mb-2 px-2 text-[10px] text-faint">
				Quick Actions
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-body hover:bg-tint hover:text-ink">
							<Plus class="size-4" />
							<span>New dashboard</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-body hover:bg-tint hover:text-ink">
							<Settings class="size-4" />
							<span>Settings</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<!-- Main navigation -->
		<Sidebar.Group class="mt-4">
			<Sidebar.GroupLabel class="label mb-2 px-2 text-[10px] text-faint">
				Navigation
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="border-l-2 border-vermillion bg-tint text-ink">
							<LayoutDashboard class="size-4" />
							<span>Dashboard</span>
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
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-body hover:bg-tint hover:text-ink">
							<div class="relative">
								<Bell class="size-4" />
								<!-- A pending notification is a state, so it takes a small vermillion tick. -->
								<span class="absolute -top-1 -right-1 block size-1.5 bg-vermillion"></span>
							</div>
							<span>Notifications</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer class="border-t border-rule p-2">
		<UserDropdown />
	</Sidebar.Footer>
</Sidebar.Root>
