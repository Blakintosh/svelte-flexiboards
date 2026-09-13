import type { LayoutServerLoad } from './$types';
import { ORIGIN } from '../../scripts/site-origin.mjs';
import { FRAMEWORK_COOKIE, isFramework } from '$lib/components/brand/framework.svelte';
import {
	PACKAGE_MANAGER_COOKIE,
	isPackageManager
} from '$lib/components/docs/package-manager.svelte';

export const load = (({ cookies }) => {
	const stored = cookies.get(FRAMEWORK_COOKIE);
	const pm = cookies.get(PACKAGE_MANAGER_COOKIE);
	return {
		siteOrigin: ORIGIN,
		framework: isFramework(stored) ? stored : null,
		packageManager: isPackageManager(pm) ? pm : null
	};
}) satisfies LayoutServerLoad;
