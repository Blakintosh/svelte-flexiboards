<script lang="ts">
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';

	// A native <details> is the whole dropdown: no library, no roving keyboard
	// handling — the account menu is set dressing around the board demo.
</script>

<details class="relative">
	<summary
		class="hover:bg-tint flex w-full cursor-pointer list-none items-center gap-3 rounded-[9px] p-2 text-left transition-colors duration-[120ms] [&::-webkit-details-marker]:hidden"
	>
		<img
			src="https://github.com/blakintosh.png"
			alt="Blakintosh"
			class="border-rule-soft size-8 shrink-0 rounded-full border"
		/>
		<div class="flex flex-1 flex-col items-start">
			<span class="text-ink text-[13px]">Blakintosh</span>
			<span class="text-faint text-[10.5px] font-semibold">Free plan</span>
		</div>
		<ChevronsUpDown class="text-faint size-4" />
	</summary>

	<div
		class="bg-panel border-rule-soft shadow-card-lg absolute bottom-full left-0 z-10 mb-2 w-full rounded-[12px] border p-1"
	>
		<button
			type="button"
			class="text-body hover:bg-tint hover:text-ink w-full cursor-pointer rounded-[9px] px-2.5 py-[7px] text-left text-[13px]"
			>Account</button
		>
		<button
			type="button"
			class="text-body hover:bg-tint hover:text-ink w-full cursor-pointer rounded-[9px] px-2.5 py-[7px] text-left text-[13px]"
			>Billing</button
		>
		<button
			type="button"
			class="text-body hover:bg-tint hover:text-ink w-full cursor-pointer rounded-[9px] px-2.5 py-[7px] text-left text-[13px]"
			>Sign out</button
		>
	</div>
</details>
