import { describe, expect, it } from 'vitest';
import { groupByTag } from './group-by-tag';

const makeItem = (tags: string[]) => ({ data: { tags } });

describe('groupByTag', () => {
  it('groups items by their tags', () => {
    const items = [
      makeItem(['covid', 'genomics']),
      makeItem(['covid']),
      makeItem(['genomics', 'heart']),
    ];
    const grouped = groupByTag(items);
    expect(grouped.get('covid')).toHaveLength(2);
    expect(grouped.get('genomics')).toHaveLength(2);
    expect(grouped.get('heart')).toHaveLength(1);
  });

  it('returns an empty map when given no items', () => {
    expect(groupByTag([]).size).toBe(0);
  });

  it('skips items with no tags', () => {
    const items = [makeItem([]), makeItem(['asthma'])];
    const grouped = groupByTag(items);
    expect(grouped.size).toBe(1);
    expect(grouped.get('asthma')).toHaveLength(1);
  });

  it('places the same item under each of its tags', () => {
    const item = makeItem(['a', 'b', 'c']);
    const grouped = groupByTag([item]);
    expect(grouped.size).toBe(3);
    for (const [, items] of grouped) {
      expect(items).toContain(item);
    }
  });
});
