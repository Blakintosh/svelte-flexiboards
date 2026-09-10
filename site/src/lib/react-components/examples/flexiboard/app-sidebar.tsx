import { ArrowRightLeft, ChartArea, LayoutDashboard, Layers } from 'lucide-react';
import Sidebar, { SidebarItem } from '../common/sidebar';
import UserDropdown from './user-dropdown';

/**
 * Twin of `examples/flexiboard/app-sidebar.svelte`, on the shared example
 * sidebar shell: no collapse, no mobile drawer — it hides below lg. The demo
 * is the board, not the nav.
 */
export default function AppSidebar() {
	const header = (
		<div className="flex items-center gap-3 px-2">
			<div className="bg-ink text-paper flex size-8 items-center justify-center rounded-[9px]">
				<Layers className="size-4" />
			</div>
			<div className="flex flex-col">
				<span className="text-ink font-serif text-sm">Flexiboard</span>
				{/* The tenant, not the page: the sheet's caption band already names the view. */}
				<span className="text-faint text-[10.5px] font-semibold">Acme Analytics</span>
			</div>
		</div>
	);

	return (
		<Sidebar header={header} footer={<UserDropdown />}>
			{/* One group, three destinations. */}
			<SidebarItem active>
				<LayoutDashboard className="size-4" />
				<span>Overview</span>
			</SidebarItem>
			<SidebarItem>
				<ArrowRightLeft className="size-4" />
				<span>Transactions</span>
			</SidebarItem>
			<SidebarItem>
				<ChartArea className="size-4" />
				<span>Reports</span>
			</SidebarItem>
		</Sidebar>
	);
}
