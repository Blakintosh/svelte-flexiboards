import { browser } from '$app/environment';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
export const packageManagers: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun'];

export type InstallAction = 'add' | 'remove' | 'dlx';

const STORAGE_KEY = 'flexiboards:package-manager';
/** Cookie mirror of the choice, so the server renders the right command. */
export const PACKAGE_MANAGER_COOKIE = 'flexiboards-pm';

export function isPackageManager(value: unknown): value is PackageManager {
	return typeof value === 'string' && (packageManagers as string[]).includes(value);
}

/** The command line for an action under a package manager. */
export function commandFor(pm: PackageManager, action: InstallAction, target: string): string {
	const verbs: Record<InstallAction, Record<PackageManager, string>> = {
		add: { npm: 'npm install', pnpm: 'pnpm add', yarn: 'yarn add', bun: 'bun add' },
		remove: { npm: 'npm uninstall', pnpm: 'pnpm remove', yarn: 'yarn remove', bun: 'bun remove' },
		dlx: { npm: 'npx', pnpm: 'pnpm dlx', yarn: 'yarn dlx', bun: 'bunx' }
	};
	return `${verbs[action][pm]} ${target}`;
}

function readStored(): PackageManager {
	if (!browser) return 'npm';
	const stored = localStorage.getItem(STORAGE_KEY);
	return isPackageManager(stored) ? stored : 'npm';
}

function persist(pm: PackageManager) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, pm);
	document.cookie = `${PACKAGE_MANAGER_COOKIE}=${pm}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * The package manager every install command on the site is shown for.
 * Persists like the framework choice: localStorage plus a cookie, so the
 * server renders the same command the client hydrates with.
 */
class PackageManagerStore {
	#current = $state<PackageManager>('npm');

	get current() {
		return this.#current;
	}

	set current(value: PackageManager) {
		this.#current = value;
		persist(value);
	}

	/** Call once from the root layout, during init, with the cookie the server read. */
	hydrate(fromCookie: PackageManager | null) {
		this.#current = fromCookie ?? readStored();
		if (browser && !fromCookie) persist(this.#current);
	}
}

export const packageManager = new PackageManagerStore();
