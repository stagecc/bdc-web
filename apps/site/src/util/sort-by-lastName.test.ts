import { describe, expect, it } from 'vitest';
import { sortByLastName } from './sort-by-lastName';

describe('sortByLastName', () => {
  it('sorts items alphabetically by key', () => {
    const items = [
      { id: 'smith-jane' },
      { id: 'adams-bob' },
      { id: 'jones-pat' },
    ];

    const result = sortByLastName(items, (item) => item.id);

    expect(result.map((i) => i.id)).toEqual([
      'adams-bob',
      'jones-pat',
      'smith-jane',
    ]);
  });

  it('pushes adhoc items to the end regardless of alphabetical order', () => {
    const items = [
      { id: 'zane-adam', adhoc: false },
      { id: 'adams-bob', adhoc: true },
      { id: 'jones-pat', adhoc: false },
    ];

    const result = sortByLastName(
      items,
      (item) => item.id,
      (item) => item.adhoc,
    );

    expect(result.map((i) => i.id)).toEqual([
      'jones-pat',
      'zane-adam',
      'adams-bob',
    ]);
  });

  it('sorts multiple adhoc items alphabetically among themselves', () => {
    const items = [
      { id: 'zane-adam', adhoc: true },
      { id: 'adams-bob', adhoc: true },
      { id: 'jones-pat', adhoc: false },
    ];

    const result = sortByLastName(
      items,
      (item) => item.id,
      (item) => item.adhoc,
    );

    expect(result.map((i) => i.id)).toEqual([
      'jones-pat',
      'adams-bob',
      'zane-adam',
    ]);
  });

  it('does not mutate the original array', () => {
    const items = [{ id: 'b' }, { id: 'a' }];
    const original = [...items];

    sortByLastName(items, (item) => item.id);

    expect(items).toEqual(original);
  });

  it('handles an empty array', () => {
    const result = sortByLastName([], (item: { id: string }) => item.id);
    expect(result).toEqual([]);
  });

  it('works without an adhoc getter', () => {
    const items = [{ id: 'b' }, { id: 'a' }];
    const result = sortByLastName(items, (item) => item.id);
    expect(result.map((i) => i.id)).toEqual(['a', 'b']);
  });
});
