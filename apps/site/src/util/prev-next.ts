import {
  type CollectionEntry,
  type CollectionKey,
  getCollection,
} from 'astro:content';

export interface PrevNextInfo {
  slug: string;
  title: string;
  date?: Date;
}

export interface EntryWithPrevNext<C extends CollectionKey> {
  entry: CollectionEntry<C>;
  newerEntry?: PrevNextInfo;
  olderEntry?: PrevNextInfo;
}

export async function getEntriesWithPrevNext<C extends CollectionKey>(
  collection: C,
  sortField: string,
): Promise<EntryWithPrevNext<C>[]> {
  const entries = await getCollection(collection);

  const sorted = entries
    .map((entry) => ({
      entry,
      time: new Date(
        (entry.data as Record<string, unknown>)[sortField] as string,
      ).getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  const toPrevNextInfo = (
    item?: (typeof sorted)[number],
  ): PrevNextInfo | undefined =>
    item
      ? {
          slug: item.entry.id,
          title: (item.entry.data as Record<string, unknown>).title as string,
          date: new Date(item.time),
        }
      : undefined;

  return sorted.map(({ entry }, i) => ({
    entry,
    newerEntry: toPrevNextInfo(sorted[i - 1]),
    olderEntry: toPrevNextInfo(sorted[i + 1]),
  }));
}
