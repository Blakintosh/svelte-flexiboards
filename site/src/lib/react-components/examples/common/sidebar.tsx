import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '$lib/utils.js';

/**
 * Static app-sidebar shell for the app-concept examples (dashboard, notes).
 * Twin of `examples/common/sidebar.svelte`: no collapse, no mobile drawer —
 * it simply hides below lg.
 */
export type SidebarProps = {
	header?: ReactNode;
	children?: ReactNode;
	footer?: ReactNode;
	className?: string;
};

export default function Sidebar({ header, children, footer, className }: SidebarProps) {
	return (
		<aside className={cn('border-rule-soft bg-paper hidden w-64 shrink-0 flex-col border-r lg:flex', className)}>
			{header && <div className="border-rule-soft border-b px-2 py-4">{header}</div>}
			<nav className="flex flex-1 flex-col gap-1 px-2 py-4">{children}</nav>
			{footer && <div className="border-rule-soft border-t p-2">{footer}</div>}
		</aside>
	);
}

export type SidebarItemProps = ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean };

export function SidebarItem({ active = false, className, ...rest }: SidebarItemProps) {
	return (
		<button
			type="button"
			aria-current={active ? 'page' : undefined}
			className={cn(
				'flex w-full items-center gap-2 rounded-[9px] px-2.5 py-[7px] text-[13px] transition-colors duration-[120ms]',
				active ? 'bg-tint text-ink font-bold' : 'text-body hover:bg-tint hover:text-ink',
				className
			)}
			{...rest}
		/>
	);
}
