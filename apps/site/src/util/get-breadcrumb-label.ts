import { navConfig } from '../config/navigation';

const ACRONYMS = ['BDC'] as const;

const PATH_LABELS = Object.fromEntries(
  navConfig.flatMap((item) =>
    (item.items ?? [])
      .filter((child) => child.href && !/^https?:\/\//.test(child.href))
      .map((child) => [
        child.href.replace(/\/+$/, '').toLowerCase(),
        child.label,
      ]),
  ),
) as Record<string, string>;

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function applyAcronyms(value: string): string {
  return ACRONYMS.reduce(
    (label, acronym) =>
      label.replace(new RegExp(`\\b${acronym}\\b`, 'gi'), acronym),
    value,
  );
}

function formatUnknownSegment(segment: string): string {
  // Treat hyphens and underscores as word separators, then title-case.
  return toTitleCase(segment.replace(/[-_]+/g, ' '));
}

export function getBreadcrumbLabel(href: string, origin?: string): string {
  try {
    // Only the pathname is used; query strings and hashes are ignored.
    const parsed = origin ? new URL(href, origin) : new URL(href);

    const segments = parsed.pathname
      .split('/')
      .filter(Boolean) // drop empties from leading/trailing slashes
      .map((segment) => decodeURIComponent(segment))
      .map((segment) => segment.replace(/\.[a-z0-9]+$/i, '')); // strip file extensions

    // Encoded slashes (%2F) decode into a segment and must not look like real path separators.
    if (segments.some((segment) => segment.includes('/'))) return '';
    if (segments.length === 0) return '';

    return segments
      .map((segment, index) => {
        // Prefer the nav label when this path prefix matches a menu link.
        const path = `/${segments.slice(0, index + 1).join('/')}`.toLowerCase();
        return applyAcronyms(
          PATH_LABELS[path] ?? formatUnknownSegment(segment),
        );
      })
      .join(' > ');
  } catch {
    return '';
  }
}
