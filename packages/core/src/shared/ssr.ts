/*
  Server-rendering flag for the whole process.

  Framework adapters call markSsrEnvironment() when they construct controllers
  without a DOM (SSR/prerender). The flag is process-global on purpose: a server
  only ever server-renders, so once set it stays set, and the browser never sets
  it. Core consults it where per-controller cleanup can't be relied on — SSR
  frameworks don't run unmount hooks, so anything a controller registers against
  a module-level singleton (the event bus) would accumulate across requests.
*/

let ssrEnvironment = false;

export function markSsrEnvironment(value: boolean = true) {
	ssrEnvironment = value;
}

export function isSsrEnvironment() {
	return ssrEnvironment;
}
