<script module lang="ts">
	import type { FlexiLayout, FlexiWidgetLayoutEntry } from '@flexiboards/svelte';
	import type { FlexiBoardSuspenseReason } from '@flexiboards/svelte';
	import BoardSkeleton from '$lib/components/examples/common/board-skeleton.svelte';
	import type { KanbanCardData } from '$lib/components/examples/kanban/kanban-card.svelte';

	type ColumnKey = 'backlog' | 'progress' | 'review' | 'done';

	const COLUMNS: Record<ColumnKey, string> = {
		backlog: 'Backlog',
		progress: 'In progress',
		review: 'In review',
		done: 'Done'
	};

	const SEED_ORDER: ColumnKey[] = ['backlog', 'progress', 'review', 'done'];

	const STORAGE_KEY = 'flexiboards-kanban-v1';

	type SavedBoard = { columns: ColumnKey[]; cards: FlexiLayout };

	function card(id: string, y: number, metadata: KanbanCardData): FlexiWidgetLayoutEntry {
		// One column of a flow grid: x is always 0 and y *is* the position.
		return { id, type: 'card', x: 0, y, width: 1, height: 1, metadata };
	}

	/** A fresh copy every call, so the seed can never be mutated by an import. */
	function seedCards(): FlexiLayout {
		return {
			backlog: [
				card('kb-1', 0, {
					title: 'Drop resolution flickers on fast reversals',
					tag: 'Bug',
					assignee: 'Ada Okonkwo',
					initials: 'AO',
					due: 'Mar 6'
				}),
				card('kb-2', 1, {
					title: 'Document the widget registry',
					tag: 'Docs',
					assignee: 'Rune Mattsson',
					initials: 'RM',
					due: 'Mar 12'
				}),
				card('kb-3', 2, {
					title: 'Spike: virtualised targets for long lists',
					tag: 'Spike',
					assignee: 'Jae Tan',
					initials: 'JT',
					due: 'Mar 20'
				})
			],
			progress: [
				card('kb-4', 0, {
					title: 'Rewrite the flow-grid drop resolver',
					tag: 'Core',
					assignee: 'Ada Okonkwo',
					initials: 'AO',
					due: 'Mar 4'
				}),
				card('kb-5', 1, {
					title: 'Keyboard pointer should announce target changes',
					tag: 'A11y',
					assignee: 'Priya Nair',
					initials: 'PN',
					due: 'Mar 9'
				}),
				card('kb-6', 2, {
					title: 'React adapter: port FlexiDelete',
					tag: 'React',
					assignee: 'Jae Tan',
					initials: 'JT',
					due: 'Mar 11'
				})
			],
			review: [
				card('kb-7', 0, {
					title: 'Persisted layouts guide',
					tag: 'Docs',
					assignee: 'Rune Mattsson',
					initials: 'RM',
					due: 'Feb 27',
					overdue: true
				}),
				card('kb-8', 1, {
					title: 'Spring transition easing curve',
					tag: 'Core',
					assignee: 'Priya Nair',
					initials: 'PN',
					due: 'Mar 5'
				})
			],
			done: [
				card('kb-9', 0, {
					title: 'Ship 0.4.0 to npm',
					tag: 'Release',
					assignee: 'Ada Okonkwo',
					initials: 'AO',
					due: 'Feb 28'
				}),
				card('kb-10', 1, {
					title: 'Fix target registration order',
					tag: 'Bug',
					assignee: 'Jae Tan',
					initials: 'JT',
					due: 'Feb 24'
				})
			]
		};
	}

	/**
	 * Deep-enough copy, normalised: entries sorted by y and renumbered, so a
	 * re-import lands every card back in the order it was left in whatever order
	 * the export happened to emit.
	 */
	function cloneLayout(layout: FlexiLayout): FlexiLayout {
		const copy: FlexiLayout = {};
		for (const key of SEED_ORDER) {
			copy[key] = [...(layout[key] ?? [])]
				.sort((a, b) => a.y - b.y)
				.map((entry, index) => ({
					...entry,
					x: 0,
					y: index,
					metadata: { ...entry.metadata }
				}));
		}
		return copy;
	}

	function countsOf(layout: FlexiLayout): Record<string, number> {
		const counts: Record<string, number> = {};
		for (const key of SEED_ORDER) counts[key] = (layout[key] ?? []).length;
		return counts;
	}

	function totalOf(layout: FlexiLayout): number {
		return SEED_ORDER.reduce((sum, key) => sum + (layout[key] ?? []).length, 0);
	}

	/**
	 * Maps the rail's live widget positions onto CSS `order` values for the card
	 * lists below, so a column's cards follow its heading while it is dragged.
	 *
	 * The heading in hand keeps a stale `x` (the grid drops it at grab time and
	 * puts a shadow in its place), so it is skipped and given whichever slot the
	 * other three left free. Defensive throughout: a missing controller or a
	 * duplicate `x` degrades to a stable order rather than to overlapping lists.
	 */
	function computeSlots(
		keys: readonly string[],
		xs: readonly (number | undefined)[],
		grabbed: readonly boolean[]
	): Record<string, number> {
		const n = keys.length;
		const taken: boolean[] = new Array(n).fill(false);
		const slots: Record<string, number> = {};

		const settled = keys
			.map((key, i) => ({ key, x: xs[i], grabbed: grabbed[i] }))
			.filter((entry): entry is { key: string; x: number; grabbed: boolean } => {
				return !entry.grabbed && typeof entry.x === 'number';
			})
			.map((entry) => ({ key: entry.key, x: Math.min(n - 1, Math.max(0, entry.x)) }))
			.sort((a, b) => a.x - b.x);

		for (const entry of settled) {
			let slot = entry.x;
			while (slot < n && taken[slot]) slot++;
			if (slot >= n) slot = taken.indexOf(false);
			if (slot < 0) continue;
			taken[slot] = true;
			slots[entry.key] = slot;
		}

		for (const key of keys) {
			if (slots[key] !== undefined) continue;
			const slot = taken.indexOf(false);
			if (slot < 0) {
				slots[key] = 0;
				continue;
			}
			taken[slot] = true;
			slots[key] = slot;
		}

		return slots;
	}
</script>

<script lang="ts">
	import {
		FlexiBoard,
		FlexiDelete,
		FlexiTarget,
		FlexiWidget,
		cssTransitionConfig,
		type FlexiBoardConfiguration,
		type FlexiBoardController,
		type FlexiDeleteController,
		type FlexiTargetController,
		type FlexiTargetPartialConfiguration,
		type FlexiWidgetChildrenSnippetParameters,
		type FlexiWidgetController
	} from '@flexiboards/svelte';
	import { browser } from '$app/environment';
	import Button from '$lib/components/examples/common/button.svelte';
	import Grabber from '$lib/components/examples/common/grabber.svelte';
	import Sheet from '$lib/components/examples/common/sheet.svelte';
	import KanbanCard from '$lib/components/examples/kanban/kanban-card.svelte';
	import KanbanAddCard from '$lib/components/examples/kanban/kanban-add-card.svelte';
	import { cn } from '$lib/utils.js';
	import Archive from 'lucide-svelte/icons/archive';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
	import Undo2 from 'lucide-svelte/icons/undo-2';

	function readSaved(): SavedBoard | null {
		if (!browser) return null;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as Partial<SavedBoard>;
			if (!parsed || typeof parsed !== 'object' || !parsed.cards) return null;

			const columns = Array.isArray(parsed.columns)
				? parsed.columns.filter((key): key is ColumnKey => key in COLUMNS)
				: [];
			// Anything short of all four columns is a stale key; start clean.
			if (new Set(columns).size !== SEED_ORDER.length) return null;

			return { columns, cards: cloneLayout(parsed.cards) };
		} catch {
			return null;
		}
	}

	const saved = readSaved();

	// Only ever read by loadLayout and reset() — never rendered, so it stays out
	// of $state.
	let pendingCards: FlexiLayout = saved?.cards ?? seedCards();
	let lastLayout: FlexiLayout = cloneLayout(pendingCards);
	let lastTotal = totalOf(pendingCards);

	// The order the headings are *declared* in. `placementStrategy: 'append'`
	// turns that into x = 0…3, and the lists follow via computeSlots().
	let columnOrder = $state<ColumnKey[]>(saved?.columns ?? [...SEED_ORDER]);

	let counts = $state<Record<string, number>>(countsOf(pendingCards));
	// Card total for the sheet's fig-caption aside ("10 cards · 2 boards").
	const totalCards = $derived(SEED_ORDER.reduce((sum, key) => sum + (counts[key] ?? 0), 0));
	let undoLayout = $state<FlexiLayout | null>(null);
	let resetToken = $state(0);

	let cardsBoard = $state<FlexiBoardController | undefined>();
	let cardTargets = $state<Record<string, FlexiTargetController | undefined>>({});
	let heads = $state<Record<string, FlexiWidgetController | undefined>>({});

	// Bound controllers are wrapped for Svelte, so these signal reads are tracked.
	// (`target.widgets` is not — hence counts come from the exported layout.)
	const slots = $derived(
		computeSlots(
			SEED_ORDER,
			SEED_ORDER.map((key) => heads[key]?.x),
			SEED_ORDER.map((key) => heads[key]?.isGrabbed ?? false)
		)
	);

	function orderedColumns(): ColumnKey[] {
		return [...SEED_ORDER].sort((a, b) => (slots[a] ?? 0) - (slots[b] ?? 0));
	}

	function persist(layout: FlexiLayout) {
		if (!browser) return;
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ columns: orderedColumns(), cards: layout } satisfies SavedBoard)
			);
		} catch {
			// Private browsing or a full quota: the board still works, it just
			// won't be remembered.
		}
	}

	/**
	 * The single place card state is reconciled. `onLayoutChange` hands us the
	 * whole board, so counts, the archive-undo offer and localStorage all come
	 * from one export rather than from three separate reads.
	 */
	function syncCards(layout: FlexiLayout) {
		const total = totalOf(layout);
		// A drop only ever moves a card; a smaller board means one was archived.
		undoLayout = total < lastTotal ? lastLayout : null;
		lastLayout = cloneLayout(layout);
		lastTotal = total;
		counts = countsOf(layout);
		persist(lastLayout);
	}

	function addCard(key: ColumnKey, title: string) {
		const target = cardTargets[key];
		if (!target) return;

		target.createWidget({
			id: `kb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
			type: 'card',
			width: 1,
			height: 1,
			metadata: {
				title,
				tag: 'Task',
				assignee: 'Unassigned',
				initials: '?',
				due: '—'
			} satisfies KanbanCardData
		});

		// TRAP WORTH KNOWING: the board's onLayoutChange only fires on
		// `widget:dropped` and `widget:delete`. createWidget() dispatches
		// neither, so an added card has to be exported and persisted by hand.
		syncCards(cardsBoard?.exportLayout() ?? lastLayout);
	}

	function undoArchive() {
		const layout = undoLayout;
		if (!layout || !cardsBoard) return;

		cardsBoard.importLayout(layout);
		// importLayout is silent too — same reason as above.
		lastLayout = cloneLayout(layout);
		lastTotal = totalOf(layout);
		counts = countsOf(layout);
		undoLayout = null;
		persist(lastLayout);
	}

	function reset() {
		if (browser) {
			try {
				localStorage.removeItem(STORAGE_KEY);
			} catch {
				// Nothing to clear if storage is unavailable.
			}
		}

		const seed = seedCards();
		pendingCards = seed;
		lastLayout = cloneLayout(seed);
		lastTotal = totalOf(seed);
		counts = countsOf(seed);
		undoLayout = null;
		columnOrder = [...SEED_ORDER];
		heads = {};
		cardTargets = {};

		// Remounting re-runs loadLayout and re-declares the headings in seed
		// order, which is the only way to put the rail's grid back as it was.
		resetToken += 1;
	}

	// Anything provisional — the drop preview — stays fx-accent; the widget in
	// hand instead picks up a lifted shadow (the tilt lives on the card contents).
	const cardClass = (widget: FlexiWidgetController) => [
		'min-w-0 cursor-grab rounded-[14px] border border-rule-soft bg-panel px-3.5 py-3 shadow-card transition-shadow duration-[120ms] select-none hover:shadow-card-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fx-accent',
		widget.isGrabbed && 'shadow-lift opacity-85',
		widget.isShadow &&
			'border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent shadow-none [&>*]:invisible'
	];

	// The heading is a status chip plus its count in the margin; the widget
	// itself is only the frame, so it carries no fill until it is in motion,
	// when it picks up the same lifted-card treatment as a card.
	const headClass = (widget: FlexiWidgetController) => [
		'flex min-w-0 items-center gap-2.5 rounded-[10px] border border-transparent px-1.5 py-1 transition-shadow duration-[120ms] select-none',
		widget.isGrabbed && 'bg-panel shadow-lift opacity-90',
		widget.isShadow &&
			'border-[1.5px] border-dashed border-fx-accent/50 bg-tint-accent [&>*]:invisible'
	];

	const cardsConfig: FlexiBoardConfiguration = {
		// One place for all four lists: a 1-column flow grid, appended to.
		targetDefaults: {
			layout: { type: 'flow', flowAxis: 'row', placementStrategy: 'append', columns: 1 }
		},
		widgetDefaults: {
			draggability: 'full',
			resizability: 'none',
			transition: cssTransitionConfig()
		},
		registry: {
			card: { component: KanbanCard, className: cardClass }
		},
		loadLayout: () => pendingCards,
		onLayoutChange: syncCards
	};

	const railConfig: FlexiBoardConfiguration = {
		widgetDefaults: {
			draggability: 'full',
			resizability: 'none',
			transition: cssTransitionConfig()
		},
		// Registered so exportLayout() stays quiet about untyped widgets.
		registry: {
			column: { className: headClass }
		},
		onLayoutChange: () => persist(lastLayout)
	};

	const railTargetConfig: FlexiTargetPartialConfiguration = {
		// Identical tracks and gap to the lists grid below, so the headings stay
		// aligned with their columns at every width — including while scrolled.
		columnSizing: 'minmax(216px, 1fr)',
		layout: {
			type: 'flow',
			flowAxis: 'row',
			placementStrategy: 'append',
			rows: 1,
			columns: 4,
			maxFlowAxis: 1
		}
	};

	// The archive tray *is* the sheet's bottom annotation band: a soft-ruled
	// strip, going fx-accent only while a card is held over it.
	// Status chips: cool tints for the flow, ink for Done, faint for Backlog.
	const CHIPS: Record<ColumnKey, { chip: string; tick: string }> = {
		backlog: { chip: 'bg-tint-2 text-body', tick: 'bg-faint' },
		progress: { chip: 'bg-tint text-blue', tick: 'bg-blue' },
		review: { chip: 'bg-tint text-blue', tick: 'bg-blue' },
		done: { chip: 'bg-tint-2 text-ink', tick: 'bg-ink' }
	};

	const trayClass = (deleter: FlexiDeleteController) => [
		'flex shrink-0 items-center gap-3 border-t border-rule-faint bg-panel px-4 py-2.5 text-faint transition-colors duration-[120ms] lg:px-8',
		deleter.isHovered && 'bg-tint-accent text-fx-accent'
	];
</script>

{#snippet columnHead({ widget }: FlexiWidgetChildrenSnippetParameters)}
	{@const key = String(widget.metadata?.key ?? '') as ColumnKey}
	{@const chip = CHIPS[key] ?? CHIPS.backlog}
	<Grabber size={14} />
	<span
		class="flex min-w-0 items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold {chip.chip}"
	>
		<!-- The status tick, a small dot. -->
		<span class="size-2 shrink-0 rounded-full {chip.tick}"></span>
		<span class="min-w-0 truncate">{widget.metadata?.title ?? ''}</span>
	</span>
	<!-- The count hangs in the margin beside the chip, not inside it. -->
	<span class="text-faint shrink-0 font-mono text-[11px]">{counts[key] ?? 0}</span>
{/snippet}

<main class="bg-paper text-ink flex h-full min-h-0 w-full flex-col p-3 lg:p-6">
	<!-- The board sheet: a live card count sits in the caption band. -->
	<Sheet
		class="min-h-0 flex-1"
		fig="Sprint board · 4 flow targets · append"
		aside="{totalCards} cards · 2 boards"
	>
		<header class="flex shrink-0 items-baseline justify-between gap-3 px-4 pt-5 lg:px-8">
			<div class="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
				<h1 class="text-ink font-serif text-xl sm:text-2xl lg:text-[30px]">Sprint 14</h1>
				<p class="text-body text-[12px]">
					Cards move between four targets;<span class="hidden sm:inline">
						the headings are a second, independent board.</span
					>
				</p>
			</div>

			<Button
				variant="outline"
				size="icon"
				class="bg-paper border-rule-soft size-[34px] shrink-0 rounded-full"
				onclick={reset}
				title="Reset board"
			>
				<RotateCcw class="size-4" />
				<span class="sr-only">Reset board</span>
			</Button>
		</header>

		{#key resetToken}
			<!--
				Board A — the cards. Four targets, one per column; a card grabbed in any
				of them can be dropped into any other, which is the whole point of the
				example. No widgets are declared here: they arrive through loadLayout.
			-->
			<FlexiBoard
				class="flex min-h-0 flex-1 flex-col"
				config={cardsConfig}
				bind:controller={cardsBoard}
			>
				{#snippet suspense(_: FlexiBoardSuspenseReason)}
					<BoardSkeleton bars={4} class="px-4 pt-5 lg:px-8" />
				{/snippet}
				<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-4 pb-3 pt-5 lg:px-8">
					<!--
						Board B — the column headings. A second, independent FlexiBoard
						nested in the first one's DOM: the two never exchange widgets,
						because every board ignores events that aren't its own.
					-->
					<FlexiBoard class="shrink-0" config={railConfig}>
						<FlexiTarget key="columns" class="gap-4" config={railTargetConfig}>
							{#each columnOrder as key (key)}
								<FlexiWidget
									type="column"
									metadata={{ key, title: COLUMNS[key] }}
									bind:controller={heads[key]}
									children={columnHead}
								/>
							{/each}
						</FlexiTarget>
					</FlexiBoard>

					<!--
						The lists. Same track template and gap as the rail above, and CSS
						`order` driven by the live heading positions, so a column's cards
						travel with its heading.
					-->
					<div class="grid shrink-0 grid-cols-[repeat(4,minmax(216px,1fr))] items-start gap-4">
						{#each SEED_ORDER as key (key)}
							<!-- No column ground: the cards sit straight on the sheet's surface. -->
							<div class="flex min-w-0 flex-col" style:order={slots[key]}>
								<FlexiTarget
									{key}
									bind:controller={cardTargets[key]}
									containerClass="flex min-w-0 flex-col"
									class={cn(
										'min-h-24 content-start gap-2',
										counts[key] === 0 && 'border-rule-soft rounded-[14px] border border-dashed'
									)}
								/>
								<!-- Below the drop rectangle, so the composer never steals a drop. -->
								<KanbanAddCard column={COLUMNS[key]} onAdd={(title) => addCard(key, title)} />
							</div>
						{/each}
					</div>
				</div>

				<!--
					Archive — the sheet's bottom annotation band. Deleting is offered with
					a way back, never silently.
				-->
				<FlexiDelete class={trayClass}>
					{#snippet children()}
						<Archive class="size-4 shrink-0" />
						{#if undoLayout}
							<span class="min-w-0 truncate text-[11.5px] font-semibold">1 card archived</span>
							<Button
								variant="ghost"
								size="sm"
								class="text-ink hover:bg-tint ml-auto h-7 shrink-0 gap-1.5 rounded-full px-2"
								onclick={undoArchive}
							>
								<Undo2 class="size-3.5" />
								<span class="ui text-xs">Undo</span>
							</Button>
						{:else}
							<span class="min-w-0 truncate text-[11.5px] font-semibold"
								>Archive<span class="hidden sm:inline">&nbsp;— drag a card here</span></span
							>
						{/if}
					{/snippet}
				</FlexiDelete>
			</FlexiBoard>
		{/key}
	</Sheet>
</main>
