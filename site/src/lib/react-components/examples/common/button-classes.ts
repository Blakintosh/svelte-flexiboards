/**
 * Example-only button styling: the site's Button variants as plain class
 * strings, so examples depend on nothing but Tailwind and the site tokens
 * (no shadcn, no tailwind-variants). Shared verbatim by the Svelte and React
 * example buttons.
 */
export const buttonBase =
	"ui inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-[13.5px] outline-none transition-[color,background-color,border-color,opacity,scale] duration-[130ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 motion-safe:active:scale-[0.97] [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0";

export const buttonVariants = {
	default: 'bg-ink text-paper hover:bg-blue hover:text-white',
	accent: 'bg-fx-accent text-white hover:bg-fx-accent-hover',
	outline: 'border border-ink bg-transparent hover:bg-tint hover:text-ink',
	secondary: 'bg-tint text-ink hover:bg-rule',
	ghost: 'text-body hover:bg-tint hover:text-ink',
	// A link is a rule under a label — it doesn't squash like a box.
	link: 'h-auto border-b border-ink px-0 py-0.5 text-[13px] hover:border-fx-accent hover:text-fx-accent active:scale-100'
} as const;

export const buttonSizes = {
	default: 'h-11 px-5 py-3',
	sm: 'h-9 gap-1.5 px-3',
	lg: 'h-12 px-6',
	icon: 'size-9'
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(variant: ButtonVariant = 'default', size: ButtonSize = 'default') {
	// Link sheds the size padding; its own classes carry h-auto/px-0.
	return `${buttonBase} ${variant === 'link' ? '' : buttonSizes[size]} ${buttonVariants[variant]}`;
}

/**
 * Native form controls, styled on the site tokens. Examples use real
 * <input>/<select>/<textarea> elements with these classes instead of shadcn's
 * wrappers — accessible by default, and identical markup in both frameworks.
 */
export const fieldClass =
	'border-rule-soft bg-panel text-ink placeholder:text-faint focus-visible:border-ink focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-[9px] border px-3 text-[13px] outline-none transition-[border-color,box-shadow] duration-[120ms] focus-visible:ring-[3px] disabled:opacity-50';
export const textareaClass = `${fieldClass} h-auto min-h-20 resize-y py-2`;
export const selectClass = `${fieldClass} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7684' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:12px] bg-[position:right_10px_center] bg-no-repeat pr-8`;
export const checkboxClass =
	'accent-ink border-rule-soft size-4 shrink-0 cursor-pointer rounded-[4px] border focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none';
export const labelClass = 'text-ink text-[12.5px] font-semibold';
