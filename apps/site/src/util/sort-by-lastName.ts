/**
 * Sorts an array of entries alphabetically by last name, with
 * optional "ad hoc" entries pushed to the end regardless of name.
 *
 * Assumes the sort key is a slug/id in "last-first" format.
 *
 * @param items - array of items to sort
 * @param getKey - function that returns the sort key (e.g. slug)
 * @param getAdhoc - optional function that returns true if the item should sort last
 */
export function sortByLastName<T>(
  items: T[],
  getKey: (item: T) => string,
  getAdhoc?: (item: T) => boolean,
): T[] {
  return [...items].sort((a, b) => {
    if (getAdhoc) {
      const adhocA = getAdhoc(a);
      const adhocB = getAdhoc(b);
      if (adhocA && !adhocB) return 1;
      if (!adhocA && adhocB) return -1;
    }
    return getKey(a).localeCompare(getKey(b));
  });
}
