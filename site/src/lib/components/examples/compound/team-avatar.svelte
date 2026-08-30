<script module lang="ts">
	export type TeamMember = {
		initials: string;
		name: string;
		role: string;
	};

	export type TeamAvatarProps = {
		member: TeamMember;
	};
</script>

<script lang="ts">
	import { getFlexiwidgetCtx } from '@flexiboards/svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { cn } from '$lib/utils.js';

	let { member }: TeamAvatarProps = $props();

	// The widget's own position in the flow target is the roster order — read live,
	// so it renumbers the moment a drop lands.
	const widget = getFlexiwidgetCtx();
	const position = $derived(widget.x + 1);
	const onCall = $derived(position === 1);
</script>

<div
	class="relative flex h-full w-full cursor-grab items-center justify-center"
	title={`${member.name} — ${member.role}`}
>
	<Avatar.Root class="border-rule bg-tint size-full rounded-none border">
		<Avatar.Fallback class="label text-blue rounded-none text-[10px]">
			{member.initials}
		</Avatar.Fallback>
	</Avatar.Root>
	<!-- Position 1 is on call now: the roster's one status, so it takes the accent. -->
	<span
		aria-hidden="true"
		class={cn(
			'pointer-events-none absolute top-px right-0.5 font-mono text-[9px] leading-none',
			onCall ? 'text-fx-accent' : 'text-faint'
		)}
	>
		{position}
	</span>
	<span class="sr-only">
		{member.name}, {member.role}, rotation position {position}{onCall ? ', on call now' : ''}
	</span>
</div>
