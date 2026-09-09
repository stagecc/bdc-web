import { describe, expect, it, vi } from 'vitest';
import {
  COLLECTION_KEY,
  EMPTY_COLLECTION,
  loadCollection,
  saveCollection,
} from './collection';

describe('dug collection storage', () => {
  it('returns empty collection when nothing is stored', () => {
    window.localStorage.removeItem(COLLECTION_KEY);

    expect(loadCollection()).toEqual(EMPTY_COLLECTION);
  });

  it('normalizes missing fields from stored values', () => {
    window.localStorage.setItem(
      COLLECTION_KEY,
      JSON.stringify({
        concepts: [{ id: 'C1', name: 'Asthma' }],
        studies: [{ id: 'S1' }],
        variables: [{ id: 'V1', name: 'Age', url: 42 }],
      }),
    );

    expect(loadCollection()).toEqual({
      concepts: [{ id: 'C1', name: 'Asthma', description: '', type: '' }],
      studies: [{ id: 'S1', name: '', url: '', source: '' }],
      variables: [{ id: 'V1', name: 'Age', description: '', url: '' }],
    });
  });

  it('returns empty collection when stored data is invalid JSON', () => {
    window.localStorage.setItem(COLLECTION_KEY, '{not-valid-json}');

    expect(loadCollection()).toEqual(EMPTY_COLLECTION);
  });

  it('saves collection to localStorage', () => {
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');
    const collection = {
      concepts: [
        { id: 'C1', name: 'Asthma', description: '', type: 'disease' },
      ],
      studies: [],
      variables: [],
    };

    saveCollection(collection);

    expect(setItemSpy).toHaveBeenCalledWith(
      COLLECTION_KEY,
      JSON.stringify(collection),
    );

    setItemSpy.mockRestore();
  });
});
