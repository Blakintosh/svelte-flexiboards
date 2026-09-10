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

	// The drop preview reads as a dashed placeholder; the avatar in hand lifts
	// off the strip instead of taking an accent outline.
	const memberClass = (widget: FlexiWidgetController) =>
		cn(
			'motion-safe:transition-[rotate] motion-safe:duration-[160ms] motion-safe:ease-out',
			widget.isShadow &&
				'rounded-[9px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent',
			widget.isGrabbed && 'rounded-[9px] shadow-lift rotate-[2.5deg]'
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
			class="bg-tint-2 gap-1.5 rounded-[9px] p-1 lg:gap-2"
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
	<span class="text-faint ml-auto hidden text-[10px] font-semibold lg:inline">flow · 1 × 6</span>
</div>
