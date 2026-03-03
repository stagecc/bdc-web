interface Taggable {
  data: { tags: string[] };
}

/**
 * Groups a list of taggable items by their tags.
 * Each item appears under every tag it carries, so a single item
 * with three tags will be present in three groups.
 *
 * @returns A map of tag names to the items that carry that tag.
 */
export function groupByTag<T extends Taggable>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    for (const tag of item.data.tags) {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)?.push(item);
    }
  }
  return map;
}
