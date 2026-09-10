import { ChevronsUpDown } from 'lucide-react';

// Workspace switcher as a native <details>: a summary styled like the old
// menu button, and a plain panel of buttons under it. No library needed.
export default function HeaderDropdown() {
	return (
		<details className="relative">
			<summary className="hover:bg-tint flex cursor-pointer list-none items-center justify-between gap-2 rounded-[9px] px-2.5 py-[7px] transition-colors duration-[120ms] [&::-webkit-details-marker]:hidden">
				<div className="flex items-center gap-4">
					<div className="bg-ink text-paper flex aspect-square size-8 items-center justify-center rounded-[9px] font-mono">
						A
					</div>
					<div className="flex flex-col gap-0.5 leading-none">
						<span className="text-ink font-serif">Acme Inc.</span>
					</div>
				</div>
				<ChevronsUpDown className="text-faint size-4" />
			</summary>

			<div className="bg-panel border-rule-soft shadow-card-lg absolute left-0 top-full z-10 mt-2 w-full rounded-[12px] border p-1">
				<button
					type="button"
					className="text-body hover:bg-tint hover:text-ink w-full cursor-pointer rounded-[9px] px-2.5 py-[7px] text-left text-[13px]"
				>
					Acme Inc.
				</button>
				<button
					type="button"
					className="text-body hover:bg-tint hover:text-ink w-full cursor-pointer rounded-[9px] px-2.5 py-[7px] text-left text-[13px]"
				>
					Personal
				</button>
				<button
					type="button"
					className="text-body hover:bg-tint hover:text-ink w-full cursor-pointer rounded-[9px] px-2.5 py-[7px] text-left text-[13px]"
				>
					New workspace
				</button>
			</div>
		</details>
	);
}
