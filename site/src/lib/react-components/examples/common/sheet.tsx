import type { ReactNode } from 'react';
import { cn } from '$lib/utils.js';

/**
 * Soft sheet chrome shared by the board-concept examples: a rounded white card
 * with a caption band on top and an annotation band underneath. Twin of
 * `examples/common/sheet.svelte`.
 */
export type SheetProps = {
	/** Left side of the top band, e.g. "Dashboard · 3 × 4 free grid". */
	fig: string;
	/** Right side of the top band. */
	aside?: string;
	/** Optional bottom annotation band. */
	footer?: ReactNode;
	children: ReactNode;
	className?: string;
	/** Class for the scrolling body between the bands. */
	bodyClass?: string;
	/** Class for the right-hand fig-band text (e.g. fx-accent while editing). */
	asideClass?: string;
	/** Class for the bottom annotation band. */
	footerClass?: string;
};

export default function Sheet({
	fig,
	aside,
	footer,
	children,
	className,
	bodyClass,
	asideClass,
	footerClass
}: SheetProps) {
	return (
		<figure
			className={cn(
				'border-rule-soft bg-panel shadow-card m-0 flex min-h-0 flex-col overflow-hidden rounded-[14px] border',
				className
			)}
		>
			<figcaption className="border-rule-faint bg-panel flex shrink-0 items-center justify-between gap-4 border-b px-4 py-2.5 lg:px-6">
				<span className="text-faint truncate text-[11.5px] font-semibold">{fig}</span>
				{aside && (
					<span className={cn('text-faint shrink-0 font-mono text-[10px]', asideClass)}>
						{aside}
					</span>
				)}
			</figcaption>

			<div className={cn('relative flex min-h-0 flex-1 flex-col', bodyClass)}>{children}</div>

			{footer && (
				<div
					className={cn(
						'border-rule-faint bg-panel flex shrink-0 items-center justify-between gap-4 border-t px-4 py-2.5 lg:px-6',
						footerClass
					)}
				>
					{footer}
				</div>
			)}
		</figure>
	);
}
