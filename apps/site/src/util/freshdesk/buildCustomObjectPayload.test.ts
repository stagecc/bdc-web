import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCustomObjectPayload } from './buildCustomObjectPayload';
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
  visible: true,
  deleted: false,
  placeholder: null,
  field_options: { unique: 'false' },
  choices: [],
  ...overrides,
});

// Mock crypto.getRandomValues for deterministic submission IDs in tests
beforeEach(() => {
  vi.stubGlobal('crypto', {
    getRandomValues: (array: Uint8Array) => {
      array.set([0x3f, 0x9a, 0x2c, 0x1d]);
      return array;
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Submission ID generation
// ---------------------------------------------------------------------------

describe('buildCustomObjectPayload — submission ID', () => {
  it('generates a submission ID in the PRIMARY field', () => {
    const payload = buildCustomObjectPayload({}, [], 'name', 'PUB');
    expect(payload.data.name).toBe('PUB-3F9A2C1D');
  });

  it('uses the provided id prefix', () => {
    const payload = buildCustomObjectPayload({}, [], 'name', 'CC');
    expect(payload.data.name).toBe('CC-3F9A2C1D');
  });

  it('uses the provided primary field name', () => {
    const payload = buildCustomObjectPayload({}, [], 'submission_id', 'PUB');
    expect(payload.data.submission_id).toBe('PUB-3F9A2C1D');
    expect(payload.data.name).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Basic field mapping
// ---------------------------------------------------------------------------

describe('buildCustomObjectPayload — field mapping', () => {
  it('maps text fields into data object', () => {
    const fields = [makeField({ name: 'title', type: 'TEXT' })];
    const values = { title: 'A study of things' };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.title).toBe('A study of things');
  });

  it('maps paragraph fields into data object', () => {
    const fields = [makeField({ name: 'journal', type: 'PARAGRAPH' })];
    const values = { journal: 'Nature Reviews' };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.journal).toBe('Nature Reviews');
  });

  it('maps date fields into data object', () => {
    const fields = [makeField({ name: 'publication_date', type: 'DATE' })];
    const values = { publication_date: '2025-06-01' };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.publication_date).toBe('2025-06-01');
  });

  it('maps checkbox fields as booleans', () => {
    const fields = [makeField({ name: 'is_active', type: 'CHECKBOX' })];
    const values = { is_active: true };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.is_active).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// MULTI_SELECT handling
// ---------------------------------------------------------------------------

describe('buildCustomObjectPayload — MULTI_SELECT', () => {
  it('passes array values through for MULTI_SELECT fields', () => {
    const fields = [
      makeField({ name: 'research_community', type: 'MULTI_SELECT' }),
    ];
    const values = { research_community: ['Heart', 'Lung', 'Blood'] };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.research_community).toEqual(['Heart', 'Lung', 'Blood']);
  });

  it('wraps a single value in an array for MULTI_SELECT fields', () => {
    const fields = [
      makeField({ name: 'research_community', type: 'MULTI_SELECT' }),
    ];
    const values = { research_community: 'Heart' };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.research_community).toEqual(['Heart']);
  });

  it('skips empty arrays for MULTI_SELECT fields', () => {
    const fields = [
      makeField({ name: 'research_community', type: 'MULTI_SELECT' }),
    ];
    const values = { research_community: '' };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.research_community).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Empty value handling
// ---------------------------------------------------------------------------

describe('buildCustomObjectPayload — empty values', () => {
  it('skips fields with empty string values', () => {
    const fields = [makeField({ name: 'journal', type: 'TEXT' })];
    const values = { journal: '' };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.journal).toBeUndefined();
  });

  it('skips fields with undefined values', () => {
    const fields = [makeField({ name: 'journal', type: 'TEXT' })];
    const values = { journal: undefined };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.journal).toBeUndefined();
  });

  it('skips fields with null values', () => {
    const fields = [makeField({ name: 'journal', type: 'TEXT' })];
    const values = { journal: null };

    const payload = buildCustomObjectPayload(values, fields);
    expect(payload.data.journal).toBeUndefined();
  });

  it('skips PRIMARY type fields from the fields array', () => {
    const fields = [
      makeField({ name: 'name', type: 'PRIMARY' }),
      makeField({ name: 'title', type: 'TEXT' }),
    ];
    const values = { name: 'user-provided-id', title: 'My Paper' };

    const payload = buildCustomObjectPayload(values, fields);
    // PRIMARY from fields array is skipped — only the generated ID is used
    expect(payload.data.name).toBe('PUB-3F9A2C1D');
    expect(payload.data.title).toBe('My Paper');
  });
});

// ---------------------------------------------------------------------------
// Realistic mixed payload
// ---------------------------------------------------------------------------

describe('buildCustomObjectPayload — realistic payload', () => {
  it('builds a complete publication submission payload', () => {
    const fields = [
      makeField({ name: 'first_name', type: 'TEXT' }),
      makeField({ name: 'last_name', type: 'TEXT' }),
      makeField({ name: 'email', type: 'TEXT' }),
      makeField({ name: 'institution', type: 'TEXT' }),
      makeField({ name: 'title', type: 'TEXT' }),
      makeField({ name: 'journal', type: 'PARAGRAPH' }),
      makeField({ name: 'publication_date', type: 'DATE' }),
      makeField({ name: 'doi_pmid_url', type: 'TEXT' }),
      makeField({ name: 'publication_status', type: 'DROPDOWN' }),
      makeField({ name: 'other_publication_status', type: 'TEXT' }),
      makeField({ name: 'research_community', type: 'MULTI_SELECT' }),
      makeField({ name: 'other_research_community', type: 'TEXT' }),
    ];

    const values = {
      first_name: 'Jane',
      last_name: 'Researcher',
      email: 'jane@university.edu',
      institution: 'State University',
      title: 'A study of heart disease',
      journal: 'Nature',
      publication_date: '2025-06-01',
      doi_pmid_url: 'https://doi.org/10.1234/example',
      publication_status: 'Published',
      other_publication_status: '', // empty — should be skipped
      research_community: ['Heart', 'Lung'],
      other_research_community: '', // empty — should be skipped
    };

    const payload = buildCustomObjectPayload(values, fields);

    expect(payload).toEqual({
      data: {
        name: 'PUB-3F9A2C1D',
        first_name: 'Jane',
        last_name: 'Researcher',
        email: 'jane@university.edu',
        institution: 'State University',
        title: 'A study of heart disease',
        journal: 'Nature',
        publication_date: '2025-06-01',
        doi_pmid_url: 'https://doi.org/10.1234/example',
        publication_status: 'Published',
        research_community: ['Heart', 'Lung'],
      },
    });
  });
});
