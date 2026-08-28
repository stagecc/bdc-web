function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export function getBreadcrumbLabel(href: string, origin?: string): string {
  try {
    const parsed = origin ? new URL(href, origin) : new URL(href);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return '';

    return segments
      .map((segment) => decodeURIComponent(segment))
      .map((segment) => segment.replace(/\.[a-z0-9]+$/i, ''))
      .map((segment) => segment.replace(/[-_]+/g, ' '))
      .map(toTitleCase)
      .join(' > ');
  } catch {
    return '';
  }
}
