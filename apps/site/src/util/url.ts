const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

export type LinkClassification =
  | 'internal'
  | 'external-gov'
  | 'external-non-gov'
  | 'other-scheme';

const normalizeHostname = (hostname: string): string =>
  hostname.toLowerCase().replace(/\.+$/, '');

const parseAbsoluteUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

export const isGovHostname = (hostname: string): boolean => {
  const normalized = normalizeHostname(hostname);
  return normalized === 'gov' || normalized.endsWith('.gov');
};

const isSameOrigin = (url: URL, currentOrigin?: string): boolean => {
  if (!currentOrigin) return false;

  try {
    return url.origin === new URL(currentOrigin).origin;
  } catch {
    return false;
  }
};

export const classifyLink = (
  url: string,
  options: { currentOrigin?: string } = {},
): LinkClassification => {
  if (url.startsWith('#')) return 'internal';

  const parsed = parseAbsoluteUrl(url);
  if (!parsed) return 'internal';

  if (!HTTP_PROTOCOLS.has(parsed.protocol)) return 'other-scheme';
  if (isSameOrigin(parsed, options.currentOrigin)) return 'internal';

  return isGovHostname(parsed.hostname) ? 'external-gov' : 'external-non-gov';
};

export const isExternalUrl = (
  url: string,
  options: { currentOrigin?: string } = {},
): boolean => {
  const kind = classifyLink(url, options);
  return kind === 'external-gov' || kind === 'external-non-gov';
};

export const requiresExitNotice = (
  url: string,
  options: { currentOrigin?: string } = {},
): boolean => classifyLink(url, options) === 'external-non-gov';
