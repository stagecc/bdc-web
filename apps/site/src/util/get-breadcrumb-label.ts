import { navConfig } from '../config/navigation';

/** Words that should stay fully capitalized in breadcrumb labels. */
const ACRONYMS = ['BDC'] as const;

/**
 * Lowercased nav hrefs to their official menu labels.
 * Compound names like "BDC-Enabled Research" keep hyphens instead of
 * being title-cased from the slug.
 */
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

/** Title-cases each space-separated word, leaving the rest of the word unchanged. */
function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

/** Replaces whole-word matches of known acronyms with their canonical casing. */
function applyAcronyms(value: string): string {
  return ACRONYMS.reduce(
    (label, acronym) =>
      label.replace(new RegExp(`\\b${acronym}\\b`, 'gi'), acronym),
    value,
  );
}

/**
 * Formats a slug segment that is not in the nav map: hyphens and
 * underscores become spaces, then the result is title-cased.
 */
function formatUnknownSegment(segment: string): string {
  return toTitleCase(segment.replace(/[-_]+/g, ' '));
}

/**
 * Builds a search-result breadcrumb from a URL.
 *
 * Path prefixes that match a header nav link use that menu label; other
 * segments are title-cased from the slug. Query strings, hashes, and
 * trailing slashes are ignored. Malformed encoding and encoded slashes
 * return an empty string.
 *
 * @example getBreadcrumbLabel('/news/bdc-enabled-research', origin)
 * // "News > BDC-Enabled Research"
 */
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
