<figure class="not-prose my-8" aria-label="One board containing two targets and three widgets">
	<figcaption class="text-body mb-3 flex items-center gap-3 text-xs">
		<span class="font-mono">Fig. 1</span>
		<span>One board, two targets, three widgets</span>
	</figcaption>
	<div class="border-rule bg-panel border">
		<div
			class="border-rule flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3 sm:px-5"
		>
			<code class="text-ink font-mono text-sm">FlexiBoard</code>
			<span class="text-body text-xs">Shared interaction state</span>
		</div>
		<div class="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
			{#each [1, 2] as count, index}
				<div class="border-rule bg-paper min-w-0 border p-3 sm:p-4">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<code class="text-body font-mono text-xs">FlexiTarget</code>
						<span class="text-body text-xs">{index === 0 ? 'A' : 'B'}</span>
					</div>
					<div class="mt-4 grid gap-3">
						{#each Array(count) as _}
							<div class="border-blue/40 bg-tint border-l-2 px-3 py-4">
								<code class="text-blue font-mono text-xs">FlexiWidget</code>
								<p class="text-body m-0 mt-1 text-sm">Your content</p>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</figure>
