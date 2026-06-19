import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFormFields, getSectionFieldIds } from './getFormFields'
import type { FreshdeskField } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeField = (overrides: Partial<FreshdeskField>): FreshdeskField => ({
  id: 1,
  name: 'cf_test_field',
  label_for_customers: 'Test Field',
  type: 'custom_text',
  required_for_customers: false,
  displayed_to_customers: true,
  archived: false,
  ...overrides,
})

// Minimal fetch mock that returns a form response
const mockFormFetch = (
  fields: FreshdeskField[],
  sections: unknown[] = []
) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ fields, sections }),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

describe('getFormFields — filtering', () => {
  it('returns fields that pass both filters', async () => {
    const fields = [
      makeField({ name: 'cf_journal', displayed_to_customers: true, archived: false }),
      makeField({ name: 'subject', displayed_to_customers: true, archived: false }),
    ]
    mockFormFetch(fields)

    const result = await getFormFields('123')
    expect(result.map((f) => f.name)).toEqual(['cf_journal', 'subject'])
  })

  it('filters out fields not displayed to customers', async () => {
    mockFormFetch([
      makeField({ name: 'cf_visible', displayed_to_customers: true }),
      makeField({ name: 'cf_hidden', displayed_to_customers: false }),
    ])

    const result = await getFormFields('123')
    expect(result.map((f) => f.name)).toEqual(['cf_visible'])
  })

  it('filters out archived fields', async () => {
    mockFormFetch([
      makeField({ name: 'cf_active', archived: false }),
      makeField({ name: 'cf_retired', archived: true }),
    ])

    const result = await getFormFields('123')
    expect(result.map((f) => f.name)).toEqual(['cf_active'])
  })

  it('returns an empty array when all fields are filtered out', async () => {
    mockFormFetch([
      makeField({ displayed_to_customers: false }),
      makeField({ archived: true }),
    ])

    const result = await getFormFields('123')
    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Choices enrichment
// ---------------------------------------------------------------------------

describe('getFormFields — choices enrichment', () => {
  it('fetches choices for custom_dropdown fields', async () => {
    const dropdownField = makeField({
      id: 100,
      name: 'cf_type',
      type: 'custom_dropdown',
    })

    const mockChoices = [
      { id: 1, label: 'Option A', value: 'option_a', position: 1, parent_choice_id: 100, choices: [] },
      { id: 2, label: 'Option B', value: 'option_b', position: 2, parent_choice_id: 100, choices: [] },
    ]

    // First call returns the form, second call returns the enriched field
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fields: [dropdownField], sections: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...dropdownField, choices: mockChoices }),
      })

    const result = await getFormFields('123')
    expect(result[0].choices).toEqual(mockChoices)
  })

  it('fetches choices for default_ticket_type fields', async () => {
    const ticketTypeField = makeField({
      id: 200,
      name: 'ticket_type',
      type: 'default_ticket_type',
    })

    const mockChoices = [
      { id: 1, label: 'Support', value: 'support', position: 1, parent_choice_id: 200, choices: [] },
    ]

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fields: [ticketTypeField], sections: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...ticketTypeField, choices: mockChoices }),
      })

    const result = await getFormFields('123')
    expect(result[0].choices).toEqual(mockChoices)
  })

  it('does not fetch choices for non-dropdown fields', async () => {
    mockFormFetch([
      makeField({ name: 'cf_text', type: 'custom_text' }),
      makeField({ name: 'cf_para', type: 'custom_paragraph' }),
    ])

    await getFormFields('123')
    // Only one fetch call — the initial form fetch, no per-field fetches
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('returns field without choices if per-field fetch fails', async () => {
    const dropdownField = makeField({
      id: 100,
      name: 'cf_type',
      type: 'custom_dropdown',
    })

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fields: [dropdownField], sections: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

    const result = await getFormFields('123')
    // Field is returned without choices rather than failing the build
    expect(result[0].choices).toBeUndefined()
    expect(result[0].name).toBe('cf_type')
  })
})

// ---------------------------------------------------------------------------
// Section resolution
// ---------------------------------------------------------------------------

describe('getFormFields — section resolution', () => {
  it('attaches resolved sections to their parent dropdown field', async () => {
    const parentField = makeField({
      id: 10,
      name: 'ticket_type',
      type: 'default_ticket_type',
    })
    const childField = makeField({
      id: 20,
      name: 'cf_details',
      type: 'custom_text',
    })

    const rawSection = {
      id: 100,
      label: 'Details',
      parent_ticket_field_id: 10,
      choice_ids: [1],
      ticket_field_ids: [20],
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fields: [parentField, childField],
          sections: [rawSection],
        }),
      })
      // Per-field fetch for choices on the dropdown
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...parentField, choices: [] }),
      })

    const result = await getFormFields('123')
    const parent = result.find((f) => f.id === 10)

    expect(parent?.sections).toHaveLength(1)
    expect(parent?.sections?.[0].id).toBe(100)
    expect(parent?.sections?.[0].fields).toHaveLength(1)
    expect(parent?.sections?.[0].fields[0].id).toBe(20)
  })

  it('returns fields unchanged when form has no sections', async () => {
    mockFormFetch([
      makeField({ name: 'cf_text', type: 'custom_text' }),
    ])

    const result = await getFormFields('123')
    expect(result[0].sections).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// getSectionFieldIds
// ---------------------------------------------------------------------------

describe('getSectionFieldIds', () => {
  it('returns IDs of all fields belonging to sections', () => {
    const fields: FreshdeskField[] = [
      makeField({
        id: 1,
        type: 'custom_dropdown',
        sections: [
          {
            id: 100,
            label: '',
            parent_ticket_field_id: 1,
            choice_ids: [1],
            ticket_field_ids: [2, 3],
            fields: [
              makeField({ id: 2 }),
              makeField({ id: 3 }),
            ],
          },
        ],
      }),
      makeField({ id: 4, type: 'custom_text' }),
    ]

    const ids = getSectionFieldIds(fields)
    expect(ids).toEqual(new Set([2, 3]))
  })

  it('returns empty set when no fields have sections', () => {
    const fields = [makeField({ id: 1 }), makeField({ id: 2 })]
    expect(getSectionFieldIds(fields)).toEqual(new Set())
  })
})

// ---------------------------------------------------------------------------
// API error handling
// ---------------------------------------------------------------------------

describe('getFormFields — error handling', () => {
  it('throws when the form API returns a non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await expect(getFormFields('123')).rejects.toThrow(
      'Freshdesk API error fetching form 123: 401 Unauthorized'
    )
  })
})