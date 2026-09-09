export type SearchResultKind = 'news' | 'event' | 'page';

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === prefix || normalized.startsWith(`${prefix}/`);
}

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
