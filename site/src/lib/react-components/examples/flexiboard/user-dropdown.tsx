import { ChevronsUpDown } from 'lucide-react';

/**
 * Twin of `examples/flexiboard/user-dropdown.svelte`: a native <details> is the
 * whole dropdown — no library, no roving keyboard handling.
 */
export default function UserDropdown() {
	const item =
		'text-body hover:bg-tint hover:text-ink w-full cursor-pointer rounded-[9px] px-2.5 py-[7px] text-left text-[13px]';
	return (
		<details className="relative">
			<summary className="hover:bg-tint flex w-full cursor-pointer list-none items-center gap-3 rounded-[9px] p-2 text-left transition-colors duration-[120ms] [&::-webkit-details-marker]:hidden">
				<img
					src="https://github.com/blakintosh.png"
					alt="Blakintosh"
					className="border-rule-soft size-8 shrink-0 rounded-full border"
				/>
				<div className="flex flex-1 flex-col items-start">
					<span className="text-ink text-[13px]">Blakintosh</span>
					<span className="text-faint text-[10.5px] font-semibold">Free plan</span>
				</div>
				<ChevronsUpDown className="text-faint size-4" />
			</summary>

			<div className="bg-panel border-rule-soft shadow-card-lg absolute bottom-full left-0 z-10 mb-2 w-full rounded-[12px] border p-1">
				<button type="button" className={item}>
					Account
				</button>
				<button type="button" className={item}>
					Billing
				</button>
				<button type="button" className={item}>
					Sign out
				</button>
			</div>
		</details>
	);
}
