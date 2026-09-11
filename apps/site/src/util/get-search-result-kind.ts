/** Badge/filter category for a search hit, derived from its URL path. */
export type SearchResultKind = 'news' | 'event' | 'page';

/** True when `pathname` is `prefix` or a nested path under it. */
function matchesPathPrefix(pathname: string, prefix: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === prefix || normalized.startsWith(`${prefix}/`);
}

/**
 * Classifies a search result from its URL: latest-updates → news,
 * events → event, anything else (or an invalid URL) → page.
 */
export function getSearchResultKind(
  href: string,
  origin?: string,
): SearchResultKind {
  try {
    const parsed = origin ? new URL(href, origin) : new URL(href);

    if (matchesPathPrefix(parsed.pathname, '/news/events')) {
      return 'event';
    }

    if (matchesPathPrefix(parsed.pathname, '/news/latest-updates')) {
      return 'news';
    }

    return 'page';
  } catch {
    return 'page';
  }
}
