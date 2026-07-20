// src/utils/prev-next.ts
import {
  type CollectionEntry,
  type CollectionKey,
  getCollection,
} from 'astro:content';

export interface NeighborInfo {
  slug: string;
  title: string;
  date?: Date;
}

export interface EntryWithNeighbors<C extends CollectionKey> {
  entry: CollectionEntry<C>;
  newerEntry?: NeighborInfo;
  olderEntry?: NeighborInfo;
}

/**
 * Fetches a collection, sorts it by a date field (newest first), and
 * attaches each entry's chronological neighbors.
 *
 * "newer" = the entry immediately more recent (index i - 1)
 * "older" = the entry immediately less recent (index i + 1)
 */
export async function getEntriesWithNeighbors<C extends CollectionKey>(
  collection: C,
  sortField: string,
): Promise<EntryWithNeighbors<C>[]> {
  const entries = await getCollection(collection);

  const getTime = (entry: CollectionEntry<C>): number =>
    new Date(
      (entry.data as Record<string, unknown>)[sortField] as string,
    ).getTime();

  const sorted = [...entries].sort((a, b) => getTime(b) - getTime(a));

  const toNeighborInfo = (
    entry?: CollectionEntry<C>,
  ): NeighborInfo | undefined =>
    entry
      ? {
          slug: entry.id,
          title: (entry.data as Record<string, unknown>).title as string,
          date: new Date(getTime(entry)),
        }
      : undefined;

  return sorted.map((entry, i) => ({
    entry,
    newerEntry: toNeighborInfo(sorted[i - 1]),
    olderEntry: toNeighborInfo(sorted[i + 1]),
  }));
}
