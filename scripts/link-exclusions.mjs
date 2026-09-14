import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const bitlyPattern = /https?:\/\/(?:www\.)?bit\.ly\/[A-Za-z0-9._~/?#=&%;+-]+/g;

export const DEFAULT_IGNORED_HOSTNAMES = ['zoom.us', 'zoomgov.com', 'hhs.gov'];

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
  });
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isIgnoredUrl(value) {
  const hostname = new URL(value).hostname.toLowerCase();
  return DEFAULT_IGNORED_HOSTNAMES.some(
    (ignored) => hostname === ignored || hostname.endsWith(`.${ignored}`),
  );
}

export function ignoredHostnamePattern() {
  const hostnames = DEFAULT_IGNORED_HOSTNAMES.map(escapeRegExp).join('|');
  return `^https?://([^/]+\\.)?(${hostnames})(/|$)`;
}

export async function findIgnoredRedirects(directory) {
  const urls = new Set();

  for (const file of htmlFiles(directory)) {
    for (const url of readFileSync(file, 'utf8').match(bitlyPattern) ?? []) {
      urls.add(url.replaceAll('&amp;', '&'));
    }
  }

  const results = await Promise.all(
    [...urls].map(async (url) => {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
        });
        return isIgnoredUrl(response.url) ? url : null;
      } catch {
        return null;
      }
    }),
  );

  return results.filter(Boolean).sort();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const directory = resolve(process.argv[2] ?? '');
  const ignoreFile = process.argv[3];

  if (!process.argv[2] || !ignoreFile) {
    console.error(
      'Usage: node scripts/link-exclusions.mjs <dist-directory> <ignore-file>',
    );
    process.exit(1);
  }

  const redirects = await findIgnoredRedirects(directory);
  const patterns = [
    ignoredHostnamePattern(),
    ...redirects.map((url) => `^${escapeRegExp(url)}$`),
  ];
  writeFileSync(resolve(ignoreFile), patterns.join('\n'));
  console.log(
    `Excluded configured hostnames and ${redirects.length} matching Bitly redirect(s).`,
  );
}
