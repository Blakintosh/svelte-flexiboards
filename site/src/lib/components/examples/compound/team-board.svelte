<script module lang="ts">
	import type { TeamMember } from './team-avatar.svelte';

	const MEMBERS: TeamMember[] = [
		{ initials: 'AK', name: 'Ada Kowal', role: 'Platform' },
		{ initials: 'RM', name: 'Rui Mendes', role: 'Data' },
		{ initials: 'JD', name: 'Jo Dunbar', role: 'Edge' },
		{ initials: 'SP', name: 'Sana Patel', role: 'Security' },
		{ initials: 'TL', name: 'Theo Lang', role: 'Release' }
	];
</script>

<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		cssTransitionConfig,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import TeamAvatar from './team-avatar.svelte';
	import type { DropScope } from './drop-log.svelte';
	import { cn } from '$lib/utils.js';

	let { onCommit }: { onCommit: (scope: DropScope) => void } = $props();

	// Anything provisional — the drop preview, the widget in hand — is dashed fx-accent.
	const memberClass = (widget: FlexiWidgetController) =>
		cn(
			widget.isShadow && 'border border-dashed border-fx-accent bg-tint-accent opacity-70',
			widget.isGrabbed && 'border border-fx-accent opacity-60'
		);
</script>

<div class="flex h-full min-h-0 min-w-0 items-center gap-4">
	<!--
		An inner board. Grab triggers are left at the library default (mouse
		immediate, touch/pen long-press), so a finger swipe over the tile still
		scrolls the page. The avatars carry no FlexiGrab, so the whole square is
		the drag surface — and the pointerdown never reaches the outer tile,
		which suppresses direct grabs because it *does* have a grabber.
	-->
	<FlexiBoard
		class="min-w-0 shrink-0"
		config={{
			widgetDefaults: {
				draggability: 'full',
				resizability: 'none',
				transition: cssTransitionConfig()
			},
			registry: {
				member: { component: TeamAvatar, className: memberClass }
			},
			onLayoutChange: () => onCommit('team')
		}}
	>
		<FlexiTarget
			key="rotation"
			class="bg-tint-2 gap-1.5 p-1 lg:gap-2"
			config={{
				columnSizing: 'minmax(0, 2.25rem)',
				rowSizing: 'minmax(0, 2.25rem)',
				layout: {
					type: 'flow',
					flowAxis: 'row',
					placementStrategy: 'append',
					columns: 6
				}
			}}
		>
			{#each MEMBERS as member (member.initials)}
				<FlexiWidget type="member" componentProps={{ member }} />
			{/each}
		</FlexiTarget>
	</FlexiBoard>

	<!-- The strip's own geometry, annotated the way the sheet annotates the outer board. -->
	<span class="label text-faint ml-auto hidden text-[9px] lg:inline">flow · 1 × 6</span>
</div>
