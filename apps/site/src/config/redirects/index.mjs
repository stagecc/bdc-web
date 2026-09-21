import { coreRedirectEntries } from './core.mjs';
import { eventRedirectEntries } from './eventRedirects.mjs';
import { latestUpdateRedirectEntries } from './latestUpdateRedirects.mjs';

/** @type {import('astro').AstroUserConfig['redirects']} */
const redirects = Object.fromEntries([
  ...coreRedirectEntries,
  ...eventRedirectEntries,
  ...latestUpdateRedirectEntries,
]);

export default redirects;
