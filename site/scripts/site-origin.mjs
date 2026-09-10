/*
  The public origin of the docs site, used wherever a generated file needs an
  absolute URL: llms.txt, the Markdown twins, and the registry items (whose
  dependency links point back here). Override with SITE_ORIGIN when building
  for another host.
*/
export const ORIGIN = (process.env.SITE_ORIGIN ?? 'https://flexiboards.dev').replace(/\/$/, '');
