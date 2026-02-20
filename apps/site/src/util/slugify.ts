/**
 * Derives a URL-friendly slug from a string.
 * If the name contains a parenthesized acronym, the acronym is lowercased is used
 * as the base; otherwise, the slugified full name is used.
 *
 * This is currently only used for program names, and
 * extending this might be desirable if other use cases arise.
 *
 * @example slugify("Trans-Omics for Precision Medicine (TOPMed)") // "topmed"
 * @example slugify("Heart Failure") // "heart-failure"
 */
export function slugify(name: string): string {
  const acronymMatch = name.match(/\(([^)]+)\)/);
  const base = acronymMatch ? acronymMatch[1] : name;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
