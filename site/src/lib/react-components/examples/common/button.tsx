import type { ButtonHTMLAttributes } from 'react';
import { cn } from '$lib/utils.js';
import { buttonClass, type ButtonSize, type ButtonVariant } from './button-classes';

/** Example-only button: plain <button> on the site's variant classes. */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
};

export default function Button({
	className,
	variant = 'default',
	size = 'default',
	type = 'button',
	...rest
}: ButtonProps) {
	return <button className={cn(buttonClass(variant, size), className)} type={type} {...rest} />;
}
