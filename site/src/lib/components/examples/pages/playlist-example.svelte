<script lang="ts">
	import {
		FlexiBoard,
		FlexiTarget,
		FlexiWidget,
		cssTransitionConfig,
		immediateTriggerConfig,
		type FlexiBoardConfiguration,
		type FlexiLayout,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import KeyboardLegend from '$lib/components/examples/playlist/keyboard-legend.svelte';
	import NowPlaying from '$lib/components/examples/playlist/now-playing.svelte';
	import PlaylistRow from '$lib/components/examples/playlist/playlist-row.svelte';
	import { TRACKS, formatDuration, type Track } from '$lib/components/examples/playlist/tracks.js';

	const BY_ID = new Map(TRACKS.map((track) => [track.id, track]));

	/** The committed order. Only rewritten when a drop actually lands. */
	let order = $state(TRACKS.map((track) => track.id));
	let liked = $state<Record<string, boolean>>({ 'weather-systems': true, 'slow-tide': true });
	let playing = $state(true);

	/** One controller per track, in TRACKS order — used only to see what is in hand. */
	let rows = $state<(FlexiWidgetController | undefined)[]>([]);
	let listEl: HTMLDivElement | undefined = $state();

	const queue = $derived(order.map((id) => BY_ID.get(id)).filter((t): t is Track => !!t));
	const current = $derived(queue[0]);
	const next = $derived(queue[1]);
	const totalLabel = $derived(formatDuration(queue.reduce((sum, track) => sum + track.seconds, 0)));

	const movingIndex = $derived(rows.findIndex((row) => row?.isGrabbed));
	const movingTrack = $derived(movingIndex >= 0 ? TRACKS[movingIndex] : null);

	// The whole integration surface: one callback, one array of ids. In a 1-column
	// flow grid the widget's y *is* its index in the list.
	function handleLayoutChange(layout: FlexiLayout) {
		const entries = layout.queue;
		if (!entries) return;

		order = [...entries]
			.sort((a, b) => a.y - b.y)
			.map((entry) => entry.id)
			.filter((id): id is string => !!id);
	}

	const boardConfig: FlexiBoardConfiguration = {
		onLayoutChange: handleLayoutChange,
		registry: {
			track: {
				// A settled row is just a ruled line; anything provisional is fx-accent.
				// The shadow's contents are hidden rather than rendered twice, so the
				// landing slot reads as an empty gap and holds no duplicate controls.
				className: (widget: FlexiWidgetController) => [
					'border-b border-rule',
					widget.isGrabbed && 'bg-panel outline-2 -outline-offset-2 outline-fx-accent',
					widget.isShadow &&
						'bg-tint-accent outline-2 outline-dashed -outline-offset-2 outline-fx-accent [&>*]:invisible'
				],
				transition: cssTransitionConfig(),
				// The handle is the only grab surface, so a press should start the drag at
				// once — no long press on touch.
				grabTrigger: { default: immediateTriggerConfig() }
			}
		}
	};

	function positionOf(id: string) {
		return order.indexOf(id) + 1;
	}

	// The portal detaches the row's node while it is in hand, which blurs the handle
	// in most browsers. Hand focus back to the same handle once the board has
	// committed or cancelled on this key, so a keyboard user never loses their place.
	function restoreFocus(id: string) {
		listEl?.querySelector<HTMLButtonElement>(`[data-track="${id}"] button`)?.focus();
	}

	$effect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Enter' && event.key !== 'Escape') return;

			const id = movingTrack?.id;
			if (!id) return;

			// Capture phase, so this reads the grabbed track before the board's own
			// window listener releases it. The refocus itself waits a tick.
			setTimeout(() => restoreFocus(id), 0);
		}

		window.addEventListener('keydown', onKeyDown, true);
		return () => window.removeEventListener('keydown', onKeyDown, true);
	});
</script>

<main class="bg-paper flex h-full min-h-0 w-full flex-col px-4 py-6 sm:px-8 lg:px-12">
	<div class="mx-auto flex min-h-0 w-full max-w-[40rem] flex-col gap-5">
		<!-- The header states the grid the queue actually is, and what it adds up to. -->
		<header class="border-rule flex shrink-0 items-baseline justify-between gap-3 border-b pb-3">
			<span class="label text-faint text-[10px]">
				Queue · {TRACKS.length} tracks · flow · 1 column
			</span>
			<span class="text-faint shrink-0 font-mono text-[10px] tabular-nums">
				{totalLabel} total
			</span>
		</header>

		<NowPlaying {current} {next} {playing} />

		<div bind:this={listEl} class="shrink-0">
			<FlexiBoard config={boardConfig}>
				<FlexiTarget
					key="queue"
					class="w-full"
					containerClass="w-full border-t border-rule"
					config={{
						rowSizing: 'minmax(0, 2.5rem)',
						columnSizing: 'minmax(0, 1fr)',
						layout: {
							type: 'flow',
							flowAxis: 'row',
							placementStrategy: 'append',
							rows: TRACKS.length,
							columns: 1
						}
					}}
				>
					{#each TRACKS as track, i (track.id)}
						<FlexiWidget
							type="track"
							id={track.id}
							onfirstcreate={(c: FlexiWidgetController) => (rows[i] = c)}
						>
							<PlaylistRow
								{track}
								position={positionOf(track.id)}
								isCurrent={order[0] === track.id}
								{playing}
								liked={!!liked[track.id]}
								onTogglePlay={() => (playing = !playing)}
								onToggleLike={() => (liked[track.id] = !liked[track.id])}
							/>
						</FlexiWidget>
					{/each}
				</FlexiTarget>
			</FlexiBoard>
		</div>

		<KeyboardLegend movingTitle={movingTrack?.title ?? null} />
	</div>
</main>
