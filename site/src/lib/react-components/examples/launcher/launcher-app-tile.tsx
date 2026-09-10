import { useFlexiWidget } from '@flexiboards/react';
import { APPS } from './apps';

/** Sentence-case caption under the glyph, sized to survive a 64px sm cell. */
export default function LauncherAppTile() {
	// The widget's identity travels in its metadata, so it survives export / import.
	const widget = useFlexiWidget();
	const key = (widget.metadata?.app as string | undefined) ?? 'mail';
	const app = APPS[key] ?? APPS.mail;
	const Icon = app.icon;

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-1.5 overflow-hidden px-0.5">
			<Icon className="text-blue size-6 lg:size-7" />
			<span className="text-faint max-w-full truncate text-[10px] font-semibold">{app.label}</span>
		</div>
	);
}
