<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import HeaderDropdown from '$lib/components/examples/flexion/header-dropdown.svelte';
	import Search from 'lucide-svelte/icons/search';
	import Activity from 'lucide-svelte/icons/activity';
	import Settings from 'lucide-svelte/icons/settings';
	import Plus from 'lucide-svelte/icons/plus';
</script>

<Sidebar.Root class="absolute h-full border-r border-rule bg-paper">
	<Sidebar.Header>
		<HeaderDropdown />
		<Sidebar.Group class="text-body">
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<Search />
							<span>Search</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<Activity />
							<span>Activity</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<Settings />
							<span>Settings</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<!-- Pages are the real navigation; the group label is an eyebrow, not a heading. -->
			<Sidebar.GroupLabel class="label text-[10px] text-faint">Pages</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="border-l-2 border-fx-accent bg-tint pl-4 text-ink"
							>Launch plan — 0.5</Sidebar.MenuButton
						>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="pl-4 text-body hover:bg-tint hover:text-ink"
							>Meeting notes</Sidebar.MenuButton
						>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton class="pl-4 text-body hover:bg-tint hover:text-ink"
							>Roadmap</Sidebar.MenuButton
						>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Group class="text-body">
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							<Plus />
							<span>Add a page</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Footer>
</Sidebar.Root>
