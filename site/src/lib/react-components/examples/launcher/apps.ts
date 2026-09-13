import { Mail, MessageSquare, Camera, CalendarDays, MapPin, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type LauncherApp = {
	label: string;
	icon: LucideIcon;
};

/**
 * The six 1x1 app tiles. A widget carries its app key in `metadata.app`, which is
 * the documented way to attach per-widget data that survives export / import.
 */
export const APPS: Record<string, LauncherApp> = {
	mail: { label: 'Mail', icon: Mail },
	messages: { label: 'Messages', icon: MessageSquare },
	camera: { label: 'Camera', icon: Camera },
	calendar: { label: 'Calendar', icon: CalendarDays },
	maps: { label: 'Maps', icon: MapPin },
	settings: { label: 'Settings', icon: Settings }
};
