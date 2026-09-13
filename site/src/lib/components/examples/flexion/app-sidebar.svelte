<script lang="ts">
	import Sidebar from '$lib/components/examples/common/sidebar.svelte';
	import SidebarItem from '$lib/components/examples/common/sidebar-item.svelte';
	import HeaderDropdown from '$lib/components/examples/flexion/header-dropdown.svelte';
	import Search from 'lucide-svelte/icons/search';
	import Activity from 'lucide-svelte/icons/activity';
	import Settings from 'lucide-svelte/icons/settings';
	import Plus from 'lucide-svelte/icons/plus';
</script>

<Sidebar {header} {footer}>
	<!-- Pages are the real navigation; the group label is an eyebrow, not a heading. -->
	<span class="text-faint px-2.5 pb-1 text-[11px] font-semibold">Pages</span>
	<SidebarItem active class="pl-4">Launch plan — 0.5</SidebarItem>
	<SidebarItem class="pl-4">Meeting notes</SidebarItem>
	<SidebarItem class="pl-4">Roadmap</SidebarItem>
</Sidebar>

{#snippet header()}
	<HeaderDropdown />
	<div class="mt-2 flex flex-col gap-1">
		<SidebarItem>
			<Search class="size-4" />
			<span>Search</span>
		</SidebarItem>
		<SidebarItem>
			<Activity class="size-4" />
			<span>Activity</span>
		</SidebarItem>
		<SidebarItem>
			<Settings class="size-4" />
			<span>Settings</span>
		</SidebarItem>
	</div>
{/snippet}

{#snippet footer()}
	<SidebarItem>
		<Plus class="size-4" />
		<span>Add a page</span>
	</SidebarItem>
{/snippet}
