import {
	FlexiBoard,
	FlexiTarget,
	FlexiWidget,
	cssTransitionConfig,
	immediateTriggerConfig,
	useFromCore
} from '@flexiboards/react';
import type {
	FlexiBoardConfiguration,
	FlexiLayout,
	FlexiTargetController,
	FlexiTargetPartialConfiguration,
	FlexiWidgetController
} from '@flexiboards/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import KeyboardLegend from '../playlist/keyboard-legend';
import NowPlaying from '../playlist/now-playing';
import PlaylistRow from '../playlist/playlist-row';
import { TRACKS, formatDuration } from '../playlist/tracks';
import type { Track } from '../playlist/tracks';

const BY_ID = new Map(TRACKS.map((track) => [track.id, track]));

// A settled row is just a hairline divider; the row in hand lifts off the
// list on its own shadow instead of an accent outline. The shadow's
// contents are hidden rather than rendered twice, so the landing slot
// reads as a dashed accent placeholder with no duplicate controls.
const rowClass = (widget: FlexiWidgetController) =>
	[
		!widget.isGrabbed && !widget.isShadow && 'border-b border-rule-faint',
		widget.isGrabbed && 'bg-panel shadow-lift rounded-[10px]',
		widget.isShadow &&
			'rounded-[10px] border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent [&>*]:invisible'
	]
		.filter(Boolean)
		.join(' ');

const queueConfig: FlexiTargetPartialConfiguration = {
	rowSizing: 'minmax(0, 2.5rem)',
	columnSizing: 'minmax(0, 1fr)',
	layout: {
		type: 'flow',
		flowAxis: 'row',
		placementStrategy: 'append',
		rows: TRACKS.length,
		columns: 1
	}
};

export default function PlaylistExample() {
	/** The committed order. Only rewritten when a drop actually lands. */
	const [order, setOrder] = useState<string[]>(() => TRACKS.map((track) => track.id));
	const [liked, setLiked] = useState<Record<string, boolean>>({
		'weather-systems': true,
		'slow-tide': true
	});
	const [playing, setPlaying] = useState(true);

	const listRef = useRef<HTMLDivElement | null>(null);

	// The target's widget set is reactive, so asking it which row is in hand needs
	// no per-row plumbing. Each row carries its track id in metadata — the widget
	// controller doesn't expose the id it was declared with.
	const [queueTarget, setQueueTarget] = useState<FlexiTargetController | null>(null);

	const movingId = useFromCore(
		useCallback(() => {
			for (const widget of queueTarget?.widgets ?? []) {
				if (widget.isGrabbed) return widget.metadata?.track as string | undefined;
			}
			return undefined;
		}, [queueTarget])
	);
	const movingTrack: Track | undefined = movingId ? BY_ID.get(movingId) : undefined;

	const queue = order.map((id) => BY_ID.get(id)).filter((t): t is Track => !!t);
	const current = queue[0];
	const next = queue[1];
	const totalLabel = formatDuration(queue.reduce((sum, track) => sum + track.seconds, 0));

	// The whole integration surface: one callback, one array of ids. In a 1-column
	// flow grid the widget's y *is* its index in the list.
	const [boardConfig] = useState<FlexiBoardConfiguration>(() => ({
		onLayoutChange: (layout: FlexiLayout) => {
			const entries = layout.queue;
			if (!entries) return;

			setOrder(
				[...entries]
					.sort((a, b) => a.y - b.y)
					.map((entry) => entry.id)
					.filter((id): id is string => !!id)
			);
		},
		registry: {
			track: {
				className: rowClass,
				transition: cssTransitionConfig(),
				// The handle is the only grab surface, so a press should start the drag at
				// once — no long press on touch.
				grabTrigger: { default: immediateTriggerConfig() }
			}
		}
	}));

	// The portal detaches the row's node while it is in hand, which blurs the handle
	// in most browsers. Hand focus back to the same handle once the board has
	// committed or cancelled on this key, so a keyboard user never loses their place.
	const movingTrackId = movingTrack?.id;
	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== 'Enter' && event.key !== 'Escape') return;
			if (!movingTrackId) return;

			// Capture phase, so this reads the grabbed track before the board's own
			// window listener releases it. The refocus itself waits a tick.
			setTimeout(() => {
				listRef.current
					?.querySelector<HTMLButtonElement>(`[data-track="${movingTrackId}"] button`)
					?.focus();
			}, 0);
		}

		window.addEventListener('keydown', onKeyDown, true);
		return () => window.removeEventListener('keydown', onKeyDown, true);
	}, [movingTrackId]);

	return (
		<main className="bg-paper flex h-full min-h-0 w-full flex-col px-4 py-6 sm:px-8 lg:px-12">
			<div className="mx-auto flex min-h-0 w-full max-w-[40rem] flex-col gap-5">
				{/* The header states the grid the queue actually is, and what it adds up to. */}
				<header className="border-rule-soft flex shrink-0 items-baseline justify-between gap-3 border-b pb-3">
					<span className="text-faint text-[11.5px] font-semibold">
						Queue · {TRACKS.length} tracks · flow · 1 column
					</span>
					<span className="text-faint shrink-0 font-mono text-[10px] tabular-nums">
						{totalLabel} total
					</span>
				</header>

				<NowPlaying current={current} next={next} playing={playing} />

				<div ref={listRef} className="shrink-0">
					<FlexiBoard config={boardConfig}>
						<FlexiTarget
							keyName="queue"
							className="w-full"
							containerClassName="border-rule-soft bg-panel shadow-card w-full overflow-hidden rounded-[14px] border"
							config={queueConfig}
							// onfirstcreate runs during the target's render, so the state write
							// that makes the controller readable here is deferred a microtask.
							onfirstcreate={(created) => queueMicrotask(() => setQueueTarget(created))}
						>
							{TRACKS.map((track) => (
								<FlexiWidget
									key={track.id}
									type="track"
									id={track.id}
									metadata={{ track: track.id }}
								>
									<PlaylistRow
										track={track}
										position={order.indexOf(track.id) + 1}
										isCurrent={order[0] === track.id}
										playing={playing}
										liked={!!liked[track.id]}
										onTogglePlay={() => setPlaying((p) => !p)}
										onToggleLike={() =>
											setLiked((current) => ({ ...current, [track.id]: !current[track.id] }))
										}
									/>
								</FlexiWidget>
							))}
						</FlexiTarget>
					</FlexiBoard>
				</div>

				<KeyboardLegend movingTitle={movingTrack?.title ?? null} />
			</div>
		</main>
	);
}
