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

<Sidebar.Root class="absolute h-full border-r bg-sidebar">
	<Sidebar.Header class="border-b px-2 py-4">
		<div class="flex items-center gap-3 px-2">
			<div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<Layers class="size-4" />
			</div>
			<div class="flex flex-col">
				<span class="text-sm font-semibold">Flexiboard</span>
				<span class="text-xs text-muted-foreground">Dashboard</span>
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="px-2 py-4">
		<!-- Quick actions -->
		<Sidebar.Group>
			<Sidebar.GroupLabel class="text-xs font-medium text-muted-foreground px-2 mb-2">
				Quick Actions
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-muted-foreground hover:text-foreground">
							<Plus class="size-4" />
							<span>New dashboard</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-muted-foreground hover:text-foreground">
							<Settings class="size-4" />
							<span>Settings</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<!-- Main navigation -->
		<Sidebar.Group class="mt-4">
			<Sidebar.GroupLabel class="text-xs font-medium text-muted-foreground px-2 mb-2">
				Navigation
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="bg-primary/10 text-primary font-medium">
							<LayoutDashboard class="size-4" />
							<span>Dashboard</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-muted-foreground hover:text-foreground">
							<ArrowRightLeft class="size-4" />
							<span>Transactions</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-muted-foreground hover:text-foreground">
							<ChartArea class="size-4" />
							<span>Reports</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="text-muted-foreground hover:text-foreground">
							<div class="relative">
								<Bell class="size-4" />
								<span class="absolute -right-1 -top-1 flex size-2">
									<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
									<span class="relative inline-flex size-2 rounded-full bg-primary"></span>
								</span>
							</div>
							<span>Notifications</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer class="border-t p-2">
		<UserDropdown />
	</Sidebar.Footer>
</Sidebar.Root>
