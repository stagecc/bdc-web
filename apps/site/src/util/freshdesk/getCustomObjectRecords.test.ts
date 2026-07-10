import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCustomObjectRecords } from './getCustomObjectRecords';
import type { CustomObjectRecord } from './typesCustomObjects';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeRecord = (
  displayId: string,
  data: Record<string, unknown>,
): CustomObjectRecord => ({
  display_id: displayId,
  data,
});

const mockRecordsFetch = (
  records: CustomObjectRecord[],
  nextMarker?: string,
) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      records,
      links: nextMarker
        ? {
            next: `https://domain.freshdesk.com/api/v2/custom_objects/schemas/1001/records?marker=${nextMarker}`,
          }
        : undefined,
    }),
  });
};

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Basic fetching
// ---------------------------------------------------------------------------

describe('getCustomObjectRecords — basic fetching', () => {
  it('returns records from the API', async () => {
    const records = [
      makeRecord('_1-1', { name: 'Publication A', journal: 'Nature' }),
      makeRecord('_1-2', { name: 'Publication B', journal: 'Science' }),
    ];
    mockRecordsFetch(records);

    const result = await getCustomObjectRecords('1001');
    expect(result).toHaveLength(2);
    expect(result[0].display_id).toBe('_1-1');
    expect(result[1].data.journal).toBe('Science');
  });

  it('returns an empty array when there are no records', async () => {
    mockRecordsFetch([]);
    const result = await getCustomObjectRecords('1001');
    expect(result).toEqual([]);
  });

  it('accepts schema ID as a number', async () => {
    mockRecordsFetch([makeRecord('_1-1', { name: 'Test' })]);
    const result = await getCustomObjectRecords(1001);
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

describe('getCustomObjectRecords — pagination', () => {
  it('fetches all pages when pagination is present', async () => {
    const page1Records = [makeRecord('_1-1', { name: 'A' })];
    const page2Records = [makeRecord('_1-2', { name: 'B' })];

    // First call returns page 1 with a next marker
    // Second call returns page 2 with no next marker
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: page1Records,
          links: {
            next: 'https://domain.freshdesk.com/api/v2/custom_objects/schemas/1001/records?marker=abc123',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: page2Records,
          links: undefined,
        }),
      });

    const result = await getCustomObjectRecords('1001');
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.data.name)).toEqual(['A', 'B']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('respects the limit option and stops paginating early', async () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord(`_1-${i + 1}`, { name: `Record ${i + 1}` }),
    );
    mockRecordsFetch(records);

    const result = await getCustomObjectRecords('1001', { limit: 3 });
    expect(result).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Filter option
// ---------------------------------------------------------------------------

describe('getCustomObjectRecords — filter option', () => {
  it('applies filter function to records', async () => {
    mockRecordsFetch([
      makeRecord('_1-1', { name: 'Active', active: true }),
      makeRecord('_1-2', { name: 'Inactive', active: false }),
    ]);

    const result = await getCustomObjectRecords('1001', {
      filter: (record) => record.data.active !== false,
    });
    expect(result).toHaveLength(1);
    expect(result[0].data.name).toBe('Active');
  });

  it('can be used to fetch active reference-data names', async () => {
    mockRecordsFetch([
      makeRecord('_1-1', { name: 'Heart', active: true }),
      makeRecord('_1-2', { name: 'Deprecated Area', active: false }),
      makeRecord('_1-3', { name: null }),
      makeRecord('_1-4', { name: 42 }),
      makeRecord('_1-5', { name: 'Lung' }),
    ]);

    const result = (
      await getCustomObjectRecords('1001', {
        filter: (record) =>
          record.data.active !== false && typeof record.data.name === 'string',
      })
    ).map((record) => record.data.name);

    expect(result).toEqual(['Heart', 'Lung']);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('getCustomObjectRecords — error handling', () => {
  it('throws when the API returns a non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    await expect(getCustomObjectRecords('1001')).rejects.toThrow(
      'Freshdesk API error fetching records for schema 1001: 403 Forbidden',
    );
  });

  it('throws on the second page if pagination fetch fails', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [makeRecord('_1-1', { name: 'A' })],
          links: {
            next: 'https://domain.freshdesk.com/api/v2/custom_objects/schemas/1001/records?marker=abc',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

    await expect(getCustomObjectRecords('1001')).rejects.toThrow(
      'Freshdesk API error fetching records for schema 1001: 500 Internal Server Error',
    );
  });
});
