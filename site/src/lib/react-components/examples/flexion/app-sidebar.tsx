import { Activity, Plus, Search, Settings } from 'lucide-react';
import Sidebar, { SidebarItem } from '../common/sidebar';
import HeaderDropdown from './header-dropdown';

/** Twin of `examples/flexion/app-sidebar.svelte`. */
export default function AppSidebar() {
	const header = (
		<>
			<HeaderDropdown />
			<div className="mt-2 flex flex-col gap-1">
				<SidebarItem>
					<Search className="size-4" />
					<span>Search</span>
				</SidebarItem>
				<SidebarItem>
					<Activity className="size-4" />
					<span>Activity</span>
				</SidebarItem>
				<SidebarItem>
					<Settings className="size-4" />
					<span>Settings</span>
				</SidebarItem>
			</div>
		</>
	);

	const footer = (
		<SidebarItem>
			<Plus className="size-4" />
			<span>Add a page</span>
		</SidebarItem>
	);

	return (
		<Sidebar header={header} footer={footer}>
			{/* Pages are the real navigation; the group label is an eyebrow, not a heading. */}
			<span className="text-faint px-2.5 pb-1 text-[11px] font-semibold">Pages</span>
			<SidebarItem active className="pl-4">
				Launch plan — 0.5
			</SidebarItem>
			<SidebarItem className="pl-4">Meeting notes</SidebarItem>
			<SidebarItem className="pl-4">Roadmap</SidebarItem>
		</Sidebar>
	);
}
