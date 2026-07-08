import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCustomObjectSchema } from './getCustomObjectSchema';
import type { CustomObjectField } from './typesCustomObjects';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeField = (
  overrides: Partial<CustomObjectField>,
): CustomObjectField => ({
  id: 'field-001',
  name: 'test_field',
  label: 'Test Field',
  type: 'TEXT',
  position: 1,
  required: false,
  editable: true,
  visible: true,
  deleted: false,
  placeholder: null,
  hint: null,
  field_options: { unique: 'false' },
  filterable: false,
  searchable: false,
  aggregatable: false,
  has_dependents: false,
  parent_id: null,
  choices: [],
  default: null,
  validations: {},
  ...overrides,
});

const mockSchemaFetch = (fields: CustomObjectField[]) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ fields }),
  });
};

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

describe('getCustomObjectSchema — filtering', () => {
  it('returns visible non-deleted non-PRIMARY fields', async () => {
    mockSchemaFetch([
      makeField({ name: 'title', type: 'TEXT', visible: true, deleted: false }),
      makeField({
        name: 'journal',
        type: 'PARAGRAPH',
        visible: true,
        deleted: false,
      }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result.map((f) => f.name)).toEqual(['title', 'journal']);
  });

  it('excludes PRIMARY fields', async () => {
    mockSchemaFetch([
      makeField({ name: 'submission_id', type: 'PRIMARY' }),
      makeField({ name: 'title', type: 'TEXT' }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result.map((f) => f.name)).toEqual(['title']);
  });

  it('excludes fields where visible is false', async () => {
    mockSchemaFetch([
      makeField({ name: 'title', visible: true }),
      makeField({ name: 'internal_note', visible: false }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result.map((f) => f.name)).toEqual(['title']);
  });

  it('excludes deleted fields', async () => {
    mockSchemaFetch([
      makeField({ name: 'title', deleted: false }),
      makeField({ name: 'old_field', deleted: true }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result.map((f) => f.name)).toEqual(['title']);
  });

  it('excludes NATIVE RELATIONSHIP fields', async () => {
    mockSchemaFetch([
      makeField({ name: 'title', type: 'TEXT' }),
      makeField({
        name: 'email_address',
        type: 'RELATIONSHIP',
        field_options: { related_object_type: 'NATIVE' },
      }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result.map((f) => f.name)).toEqual(['title']);
  });

  it('includes CUSTOM RELATIONSHIP fields', async () => {
    mockSchemaFetch([
      makeField({ name: 'title', type: 'TEXT' }),
      makeField({
        name: 'publication_status',
        type: 'RELATIONSHIP',
        field_options: { related_object_type: 'CUSTOM', ui_hint: 'radio' },
      }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result.map((f) => f.name)).toEqual(['title', 'publication_status']);
  });

  it('returns an empty array when all fields are filtered out', async () => {
    mockSchemaFetch([
      makeField({ type: 'PRIMARY' }),
      makeField({ visible: false }),
      makeField({ deleted: true }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------------

describe('getCustomObjectSchema — choices', () => {
  it('includes choices on MULTI_SELECT fields', async () => {
    const choices = [
      { id: 1, value: 'Heart', position: 1, dependent_ids: {} },
      { id: 2, value: 'Lung', position: 2, dependent_ids: {} },
    ];
    mockSchemaFetch([
      makeField({ name: 'research_area', type: 'MULTI_SELECT', choices }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result[0].choices).toEqual(choices);
  });

  it('includes choices on DROPDOWN fields', async () => {
    const choices = [
      { id: 1, value: 'Published', position: 1, dependent_ids: {} },
      { id: 2, value: 'Preprint', position: 2, dependent_ids: {} },
    ];
    mockSchemaFetch([
      makeField({ name: 'publication_status', type: 'DROPDOWN', choices }),
    ]);

    const result = await getCustomObjectSchema('1001');
    expect(result[0].choices).toEqual(choices);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('getCustomObjectSchema — error handling', () => {
  it('throws when the API returns a non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getCustomObjectSchema('1001')).rejects.toThrow(
      'Freshdesk API error fetching custom object schema 1001: 404 Not Found',
    );
  });

  it('accepts schema ID as a number', async () => {
    mockSchemaFetch([makeField({ name: 'title' })]);
    const result = await getCustomObjectSchema(1001);
    expect(result).toHaveLength(1);
  });
});
