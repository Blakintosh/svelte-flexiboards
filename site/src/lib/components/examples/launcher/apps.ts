import Mail from 'lucide-svelte/icons/mail';
import MessageSquare from 'lucide-svelte/icons/message-square';
import Camera from 'lucide-svelte/icons/camera';
import CalendarDays from 'lucide-svelte/icons/calendar-days';
import MapPin from 'lucide-svelte/icons/map-pin';
import Settings from 'lucide-svelte/icons/settings';

export type LauncherApp = {
	label: string;
	icon: typeof Mail;
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
