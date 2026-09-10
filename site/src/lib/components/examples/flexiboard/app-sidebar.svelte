<script lang="ts">
	import Sidebar from '$lib/components/examples/common/sidebar.svelte';
	import SidebarItem from '$lib/components/examples/common/sidebar-item.svelte';
	import UserDropdown from './user-dropdown.svelte';

	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import ArrowRightLeft from 'lucide-svelte/icons/arrow-right-left';
	import ChartArea from 'lucide-svelte/icons/chart-area';
	import Layers from 'lucide-svelte/icons/layers';
</script>

<Sidebar {header} {footer}>
	<!-- One group, three destinations. The demo is the board, not the nav. -->
	<SidebarItem active>
		<LayoutDashboard class="size-4" />
		<span>Overview</span>
	</SidebarItem>
	<SidebarItem>
		<ArrowRightLeft class="size-4" />
		<span>Transactions</span>
	</SidebarItem>
	<SidebarItem>
		<ChartArea class="size-4" />
		<span>Reports</span>
	</SidebarItem>
</Sidebar>

{#snippet header()}
	<div class="flex items-center gap-3 px-2">
		<div class="bg-ink text-paper flex size-8 items-center justify-center rounded-[9px]">
			<Layers class="size-4" />
		</div>
		<div class="flex flex-col">
			<span class="text-ink font-serif text-sm">Flexiboard</span>
			<!-- The tenant, not the page: the sheet's caption band already names the view. -->
			<span class="text-faint text-[10.5px] font-semibold">Acme Analytics</span>
		</div>
	</div>
{/snippet}

{#snippet footer()}
	<UserDropdown />
{/snippet}
