<script lang="ts">
	/*
	  §02 "One engine to power them all" — an accordion of the six capabilities,
	  each backed by a looping schematic of that capability drawn as a dark
	  drafting screen. The screens stack as a deck fanned to the lower right;
	  choosing an item springs its screen to the front.

	  Every screen is a board sketched in 1px frames on a lattice: solid faint
	  frames are placed widgets, the dashed frame is the shadow (drop preview),
	  the accent frame is the widget in motion, and the white dot is the cursor.
	*/
	let active = $state(0);

	const items = [
		{
			title: 'Free-form',
			body: 'Sparse layouts with collision resolution. Powers your grids and dashboard layouts.'
		},
		{
			title: 'Flow',
			body: 'Ordered rows or columns with append or prepend placement. Suitable for Kanban, ordered layouts and all your sortable lists.'
		},
		{
			title: 'Per breakpoint',
			body: 'Responsively render different layouts at each breakpoint, so that your board always fits the viewport.'
		},
		{
			title: 'Adders & deleters',
			body: "Spawn widgets with a click action on an 'adder', drag widgets over a 'deleter' to delete them."
		},
		{
			title: 'Multiple targets',
			body: 'Move widgets between multiple target dropzones within the same board, no matter the layout.'
		},
		{
			title: 'Export & import',
			body: 'Persist changes to layouts by exporting to JSON, then restore the layout by importing it.'
		}
	];

	/* Deck offsets by depth behind the front card. */
	const OFFSETS = [
		{ x: 0, y: 0, r: 0, s: 1, o: 1, z: 6 },
		{ x: 22, y: 14, r: 2, s: 0.96, o: 0.45, z: 5 },
		{ x: 40, y: 26, r: 4, s: 0.93, o: 0.24, z: 4 },
		{ x: 56, y: 38, r: 5.5, s: 0.9, o: 0.12, z: 3 },
		{ x: 70, y: 48, r: 7, s: 0.88, o: 0.05, z: 2 },
		{ x: 82, y: 58, r: 8, s: 0.86, o: 0, z: 1 }
	];

	function deckStyle(i: number) {
		const off = OFFSETS[(i - active + items.length) % items.length];
		return `transform: translate(${off.x}px, ${off.y}px) rotate(${off.r}deg) scale(${off.s}); opacity: ${off.o}; z-index: ${off.z}`;
	}
</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-center gap-14">
	<div class="border-rule flex flex-col border-t">
		{#each items as item, i (item.title)}
			{@const selected = active === i}
			<div class="border-rule border-b">
				<button
					type="button"
					onclick={() => (active = i)}
					aria-expanded={selected}
					class="ease-snap flex w-full cursor-pointer items-center gap-3.5 border-none bg-transparent py-4 text-left transition-colors duration-[250ms] {selected
						? 'text-ink'
						: 'text-body'}"
				>
					<span
						class="ease-snap font-mono text-[11px] transition-colors duration-[250ms] {selected
							? 'text-fx-accent'
							: 'text-faint'}"
					>
						0{i + 1}
					</span>
					<span class="font-serif text-[17px] font-semibold">{item.title}</span>
				</button>
				<div
					class="ease-snap grid transition-[grid-template-rows] duration-[400ms]"
					style="grid-template-rows: {selected ? '1fr' : '0fr'}"
				>
					<div class="min-h-0 overflow-hidden">
						<p
							class="text-body m-0 box-content max-w-[420px] pb-4.5 pl-[34px] text-sm leading-[1.6]"
							style="min-height: 44.8px"
						>
							{item.body}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="relative h-[286px] w-[384px] max-w-full justify-self-center">
		<!-- 01 · free-form / collision -->
		<div class="deck-card" style={deckStyle(0)}>
			<div class="screen">
				<div class="screen-label">free-form · collision</div>
				<div class="frame f1-other" style="left:20px;top:36px;width:120px;height:64px">other</div>
				<div class="frame" style="left:168px;top:128px;width:132px;height:76px"></div>
				<div class="ghost f1-ghost" style="left:20px;top:128px;width:120px;height:64px"></div>
				<div class="widget f1-widget" style="left:20px;top:128px;width:120px;height:64px">
					widget
				</div>
				<div class="cursor f1-cursor"></div>
			</div>
		</div>

		<!-- 02 · flow / reorder -->
		<div class="deck-card" style={deckStyle(1)}>
			<div class="screen">
				<div class="screen-label">flow · reorder</div>
				<div class="frame" style="left:70px;top:36px;width:180px;height:168px"></div>
				<div class="ghost f5-ghost" style="left:100px;top:132px;width:120px;height:36px"></div>
				<div class="frame f5-s1" style="left:100px;top:44px;width:120px;height:36px"></div>
				<div class="frame f5-s2" style="left:100px;top:88px;width:120px;height:36px"></div>
				<div class="widget f5-widget" style="left:100px;top:132px;width:120px;height:36px"></div>
				<div class="cursor f5-cursor"></div>
			</div>
		</div>

		<!-- 03 · per breakpoint -->
		<div class="deck-card" style={deckStyle(2)}>
			<div class="screen">
				<div class="screen-label">per breakpoint</div>
				<div class="frame f6-frame" style="left:60px;top:40px;height:160px;border-radius:6px">
					<div class="fill f6-a">
						<div class="widget" style="left:10px;top:12px;width:84px;height:56px"></div>
						<div class="frame" style="left:104px;top:12px;width:84px;height:56px"></div>
						<div class="frame" style="left:10px;top:78px;width:178px;height:44px"></div>
					</div>
					<div class="fill f6-b">
						<div class="widget" style="left:10px;top:12px;width:94px;height:40px"></div>
						<div class="frame" style="left:10px;top:60px;width:94px;height:40px"></div>
						<div class="frame" style="left:10px;top:108px;width:94px;height:40px"></div>
					</div>
				</div>
				<div class="screen-note f6-a" style="left:60px;bottom:14px">lg · 1024</div>
				<div class="screen-note f6-b" style="left:60px;bottom:14px">sm · 390</div>
			</div>
		</div>

		<!-- 04 · adders / deleters -->
		<div class="deck-card" style={deckStyle(3)}>
			<div class="screen">
				<div class="screen-label">adders · deleters</div>
				<div class="frame" style="left:16px;top:36px;width:74px;height:168px"></div>
				<div class="screen-note" style="left:24px;top:186px">palette</div>
				<div class="adder" style="left:28px;top:64px;width:50px;height:26px">+</div>
				<div class="frame" style="left:112px;top:70px;width:180px;height:60px"></div>
				<div class="ghost f2-ghost" style="left:122px;top:78px;width:160px;height:44px"></div>
				<div
					class="widget f2-widget"
					style="left:28px;top:64px;width:50px;height:26px;border-radius:3px"
				></div>
				<div class="frame f2-bin" style="left:254px;top:192px;width:34px;height:28px">bin</div>
				<div class="cursor f2-cursor"></div>
			</div>
		</div>

		<!-- 05 · multiple targets -->
		<div class="deck-card" style={deckStyle(4)}>
			<div class="screen">
				<div class="screen-label">multiple targets</div>
				<div class="frame" style="left:16px;top:36px;width:128px;height:168px"></div>
				<div class="screen-note" style="left:24px;top:186px">free</div>
				<div class="frame" style="left:160px;top:36px;width:144px;height:168px"></div>
				<div class="screen-note" style="left:168px;top:186px">flow</div>
				<div class="frame f3-item" style="left:170px;top:64px;width:124px;height:34px"></div>
				<div class="frame f3-item" style="left:170px;top:106px;width:124px;height:34px"></div>
				<div class="ghost f3-ghost" style="left:26px;top:120px;width:108px;height:44px"></div>
				<div class="widget f3-widget" style="left:26px;top:120px;width:108px;height:44px"></div>
				<div class="cursor f3-cursor"></div>
			</div>
		</div>

		<!-- 06 · export / import -->
		<div class="deck-card" style={deckStyle(5)}>
			<div class="screen">
				<div class="screen-label">export · import</div>
				<div class="fill f4-board">
					<div class="frame" style="left:20px;top:40px;width:130px;height:70px"></div>
					<div class="frame" style="left:166px;top:40px;width:134px;height:150px"></div>
					<div class="widget" style="left:20px;top:126px;width:130px;height:64px"></div>
				</div>
				<div class="json f4-json">board.json</div>
				<div class="screen-note" style="left:12px;bottom:10px">serialise ⇄ hydrate</div>
			</div>
		</div>
	</div>
</div>

<style>
	.deck-card {
		position: absolute;
		left: 0;
		top: 0;
		width: 320px;
		height: 240px;
		border-radius: 10px;
		box-shadow: 0 18px 40px rgba(16, 32, 46, 0.25);
		transform-origin: bottom left;
		transition:
			transform 680ms cubic-bezier(0.3, 1.25, 0.45, 1),
			opacity 520ms var(--ease-snap);
	}

	.screen {
		position: absolute;
		inset: 0;
		background: #0f1d2b;
		background-image:
			linear-gradient(rgba(148, 170, 190, 0.13) 1px, transparent 1px),
			linear-gradient(90deg, rgba(148, 170, 190, 0.13) 1px, transparent 1px);
		background-size: 24px 24px;
		border-radius: 10px;
		overflow: hidden;
		font-family: var(--font-mono);
	}

	.screen-label {
		position: absolute;
		left: 12px;
		top: 10px;
		font-size: 9.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #7e93a6;
	}

	.screen-note {
		position: absolute;
		font-size: 9px;
		color: #7e93a6;
	}

	.fill {
		position: absolute;
		inset: 0;
	}

	/* Placed widget: a faint 1px frame. */
	.frame {
		position: absolute;
		border: 1px solid rgba(233, 240, 246, 0.5);
		border-radius: 4px;
		box-sizing: border-box;
		font-size: 9px;
		color: #7e93a6;
	}

	/* Drop preview. */
	.ghost {
		position: absolute;
		border: 1px dashed rgba(233, 240, 246, 0.55);
		border-radius: 4px;
		box-sizing: border-box;
	}

	/* The widget in motion: accent frame on an accent tint. */
	.widget {
		position: absolute;
		border: 1px solid var(--fx-accent);
		background: color-mix(in srgb, var(--fx-accent) 18%, transparent);
		border-radius: 4px;
		box-sizing: border-box;
		display: flex;
		align-items: flex-end;
		padding: 6px;
		font-size: 9px;
		color: var(--fx-accent);
	}

	.adder {
		position: absolute;
		border: 1px dashed var(--fx-accent);
		border-radius: 4px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		color: var(--fx-accent);
	}

	.cursor {
		position: absolute;
		left: 0;
		top: 0;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25);
	}

	.json {
		position: absolute;
		left: 50%;
		top: 50%;
		margin-left: -62px;
		margin-top: -20px;
		width: 124px;
		height: 40px;
		border: 1px solid var(--fx-accent);
		background: #0f1d2b;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		color: var(--fx-accent);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
	}

	/* --- 01 free-form: pick up, dodge the occupied cell, settle ------------ */
	.f1-other {
		display: flex;
		align-items: flex-end;
		padding: 6px;
		animation: f1o 6s ease-in-out infinite;
	}
	.f1-ghost {
		animation: f1g2 6s ease-in-out infinite;
	}
	.f1-widget {
		animation: f1w2 6s ease-in-out infinite;
	}
	.f1-cursor {
		animation: f1c2 6s ease-in-out infinite;
	}
	@keyframes f1w2 {
		0%,
		12% {
			transform: translate(0, 0) scale(1);
			opacity: 1;
		}
		16% {
			transform: translate(0, 0) scale(1.05);
		}
		22% {
			transform: translate(0, -18px) scale(1.05);
		}
		44% {
			transform: translate(0, -92px) scale(1.05);
		}
		52%,
		88% {
			transform: translate(0, -92px) scale(1);
			opacity: 1;
		}
		93% {
			transform: translate(0, -92px);
			opacity: 0;
		}
		94% {
			transform: translate(0, 0);
			opacity: 0;
		}
		100% {
			transform: translate(0, 0);
			opacity: 1;
		}
	}
	@keyframes f1g2 {
		0%,
		13% {
			opacity: 0;
			transform: translate(0, 0);
		}
		16%,
		28% {
			opacity: 1;
			transform: translate(0, 0);
		}
		36%,
		48% {
			opacity: 1;
			transform: translate(0, -92px);
		}
		54%,
		98% {
			opacity: 0;
			transform: translate(0, -92px);
		}
		100% {
			opacity: 0;
			transform: translate(0, 0);
		}
	}
	@keyframes f1o {
		0%,
		30% {
			transform: none;
			opacity: 1;
		}
		42%,
		91% {
			transform: translate(148px, 0);
			opacity: 1;
		}
		95% {
			transform: translate(148px, 0);
			opacity: 0;
		}
		96% {
			transform: none;
			opacity: 0;
		}
		100% {
			transform: none;
			opacity: 1;
		}
	}
	@keyframes f1c2 {
		0% {
			transform: translate(72px, 172px);
			opacity: 0;
		}
		10%,
		14% {
			transform: translate(72px, 152px);
			opacity: 1;
		}
		44%,
		54% {
			transform: translate(72px, 60px);
			opacity: 1;
		}
		64%,
		100% {
			transform: translate(72px, 60px);
			opacity: 0;
		}
	}

	/* --- 02 flow: lift the last item to the top; siblings shuffle down ----- */
	.f5-ghost {
		animation: f5g 6s ease-in-out infinite;
	}
	.f5-s1 {
		animation: f5s1 6s ease-in-out infinite;
	}
	.f5-s2 {
		animation: f5s2 6s ease-in-out infinite;
	}
	.f5-widget {
		animation: f5w 6s ease-in-out infinite;
	}
	.f5-cursor {
		animation: f5c 6s ease-in-out infinite;
	}
	@keyframes f5w {
		0%,
		12% {
			transform: translate(0, 0) scale(1);
			opacity: 1;
		}
		18% {
			transform: translate(0, 0) scale(1.05);
		}
		32% {
			transform: translate(0, -46px) scale(1.05);
		}
		48% {
			transform: translate(0, -88px) scale(1.05);
		}
		56%,
		88% {
			transform: translate(0, -88px) scale(1);
			opacity: 1;
		}
		93% {
			transform: translate(0, -88px);
			opacity: 0;
		}
		94% {
			transform: translate(0, 0);
			opacity: 0;
		}
		100% {
			transform: translate(0, 0);
			opacity: 1;
		}
	}
	@keyframes f5g {
		0%,
		13% {
			opacity: 0;
			transform: translate(0, 0);
		}
		16%,
		24% {
			opacity: 1;
			transform: translate(0, 0);
		}
		30%,
		38% {
			opacity: 1;
			transform: translate(0, -44px);
		}
		44%,
		50% {
			opacity: 1;
			transform: translate(0, -88px);
		}
		56%,
		98% {
			opacity: 0;
			transform: translate(0, -88px);
		}
		100% {
			opacity: 0;
			transform: translate(0, 0);
		}
	}
	@keyframes f5s1 {
		0%,
		40% {
			transform: none;
			opacity: 1;
		}
		48%,
		90% {
			transform: translateY(44px);
			opacity: 1;
		}
		93% {
			transform: translateY(44px);
			opacity: 0;
		}
		94% {
			transform: none;
			opacity: 0;
		}
		100% {
			transform: none;
			opacity: 1;
		}
	}
	@keyframes f5s2 {
		0%,
		26% {
			transform: none;
			opacity: 1;
		}
		34%,
		90% {
			transform: translateY(44px);
			opacity: 1;
		}
		93% {
			transform: translateY(44px);
			opacity: 0;
		}
		94% {
			transform: none;
			opacity: 0;
		}
		100% {
			transform: none;
			opacity: 1;
		}
	}
	@keyframes f5c {
		0% {
			transform: translate(155px, 165px);
			opacity: 0;
		}
		10%,
		12% {
			transform: translate(155px, 145px);
			opacity: 1;
		}
		48%,
		58% {
			transform: translate(155px, 57px);
			opacity: 1;
		}
		68%,
		100% {
			transform: translate(155px, 57px);
			opacity: 0;
		}
	}

	/* --- 03 per breakpoint: the viewport narrows, layouts crossfade -------- */
	.f6-frame {
		animation: f6f 6s ease-in-out infinite;
		width: 200px;
	}
	.f6-a {
		animation: f6a 6s ease-in-out infinite;
	}
	.f6-b {
		animation: f6b 6s ease-in-out infinite;
	}
	@keyframes f6f {
		0%,
		32% {
			width: 200px;
		}
		50%,
		82% {
			width: 116px;
		}
		100% {
			width: 200px;
		}
	}
	@keyframes f6a {
		0%,
		36% {
			opacity: 1;
		}
		48%,
		84% {
			opacity: 0;
		}
		96%,
		100% {
			opacity: 1;
		}
	}
	@keyframes f6b {
		0%,
		36% {
			opacity: 0;
		}
		48%,
		84% {
			opacity: 1;
		}
		96%,
		100% {
			opacity: 0;
		}
	}

	/* --- 04 adders/deleters: spawn from the palette, drop into the bin ----- */
	.f2-ghost {
		animation: f2g 6s ease-in-out infinite;
	}
	.f2-widget {
		animation: f2a 6s ease-in-out infinite;
		padding: 0;
	}
	.f2-bin {
		display: flex;
		align-items: center;
		justify-content: center;
		animation: f2b 6s ease-in-out infinite;
	}
	.f2-cursor {
		animation: f2c 6s ease-in-out infinite;
	}
	@keyframes f2a {
		0%,
		6% {
			transform: translate(0, 0) scale(1);
			opacity: 0;
		}
		10% {
			transform: translate(0, 0) scale(1.08);
			opacity: 1;
		}
		36%,
		60% {
			transform: translate(149px, 23px) scale(3.2, 1.7);
			opacity: 1;
		}
		76% {
			transform: translate(218px, 129px) scale(1, 0.6);
			opacity: 0.85;
		}
		80%,
		100% {
			transform: translate(218px, 129px) scale(0.8, 0.4);
			opacity: 0;
		}
	}
	@keyframes f2g {
		0%,
		12% {
			opacity: 0;
		}
		16%,
		34% {
			opacity: 1;
		}
		40%,
		100% {
			opacity: 0;
		}
	}
	@keyframes f2b {
		0%,
		74% {
			transform: scale(1);
			border-color: rgba(233, 240, 246, 0.5);
		}
		79% {
			transform: scale(1.18);
			border-color: var(--fx-accent);
		}
		86%,
		100% {
			transform: scale(1);
			border-color: rgba(233, 240, 246, 0.5);
		}
	}
	@keyframes f2c {
		0% {
			transform: translate(48px, 92px);
			opacity: 0;
		}
		8%,
		10% {
			transform: translate(48px, 72px);
			opacity: 1;
		}
		36%,
		60% {
			transform: translate(197px, 95px);
			opacity: 1;
		}
		74%,
		80% {
			transform: translate(266px, 201px);
			opacity: 1;
		}
		88%,
		100% {
			transform: translate(266px, 201px);
			opacity: 0;
		}
	}

	/* --- 05 multiple targets: free-form widget lands in the flow column ---- */
	.f3-item {
		animation: f3i 6s ease-in-out infinite;
	}
	.f3-ghost {
		animation: f3g 6s ease-in-out infinite;
	}
	.f3-widget {
		animation: f3w 6s ease-in-out infinite;
	}
	.f3-cursor {
		animation: f3c 6s ease-in-out infinite;
	}
	@keyframes f3w {
		0%,
		12% {
			transform: translate(0, 0) scale(1);
			opacity: 1;
		}
		18% {
			transform: translate(0, 0) scale(1.05);
		}
		48% {
			transform: translate(152px, 23px) scale(1.2, 0.85);
		}
		56%,
		88% {
			transform: translate(152px, 23px) scale(1.148, 0.773);
			opacity: 1;
		}
		93% {
			transform: translate(152px, 23px) scale(1.148, 0.773);
			opacity: 0;
		}
		94% {
			transform: translate(0, 0);
			opacity: 0;
		}
		100% {
			transform: translate(0, 0);
			opacity: 1;
		}
	}
	@keyframes f3g {
		0%,
		13% {
			opacity: 0;
			transform: translate(0, 0);
		}
		16%,
		30% {
			opacity: 1;
			transform: translate(0, 0);
		}
		38%,
		50% {
			opacity: 1;
			transform: translate(152px, 23px) scale(1.148, 0.773);
		}
		56%,
		98% {
			opacity: 0;
			transform: translate(152px, 23px) scale(1.148, 0.773);
		}
		100% {
			opacity: 0;
			transform: translate(0, 0);
		}
	}
	@keyframes f3i {
		0%,
		38% {
			transform: none;
		}
		46% {
			transform: translateY(-3px);
		}
		58%,
		100% {
			transform: none;
		}
	}
	@keyframes f3c {
		0% {
			transform: translate(73px, 155px);
			opacity: 0;
		}
		10%,
		12% {
			transform: translate(73px, 135px);
			opacity: 1;
		}
		48%,
		58% {
			transform: translate(227px, 160px);
			opacity: 1;
		}
		70%,
		100% {
			transform: translate(227px, 160px);
			opacity: 0;
		}
	}

	/* --- 06 export/import: the board dims behind its serialised form ------- */
	.f4-board {
		animation: f4b 6s ease-in-out infinite;
	}
	.f4-json {
		animation: f4j 6s ease-in-out infinite;
	}
	@keyframes f4b {
		0%,
		15% {
			opacity: 1;
		}
		30%,
		60% {
			opacity: 0.3;
		}
		78%,
		100% {
			opacity: 1;
		}
	}
	@keyframes f4j {
		0%,
		18% {
			opacity: 0;
			transform: translateY(10px) scale(0.95);
		}
		30%,
		62% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
		76%,
		100% {
			opacity: 0;
			transform: translateY(10px) scale(0.95);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		/* Each screen shows its resting arrangement, statically. */
		.deck-card,
		.deck-card :global(*) {
			animation: none !important;
			transition-duration: 1ms;
		}
		.cursor,
		.ghost {
			display: none;
		}
	}
</style>
