import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFormFields } from './getFormFields'
import type { FreshdeskField } from './types'

// Minimal field factory — only the properties getFormFields cares about.
// Tests that need other properties can override via spread.
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

const mockFetch = (fields: FreshdeskField[]) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ fields }),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('getFormFields', () => {
  it('returns fields that pass both filters', async () => {
    const fields = [
      makeField({ name: 'cf_journal', displayed_to_customers: true, archived: false }),
      makeField({ name: 'subject', displayed_to_customers: true, archived: false }),
    ]
    mockFetch(fields)

    const result = await getFormFields('123')
    expect(result.map((f) => f.name)).toEqual(['cf_journal', 'subject'])
  })

  it('filters out fields not displayed to customers', async () => {
    const fields = [
      makeField({ name: 'cf_visible', displayed_to_customers: true }),
      makeField({ name: 'cf_hidden', displayed_to_customers: false }),
    ]
    mockFetch(fields)

    const result = await getFormFields('123')
    expect(result.map((f) => f.name)).toEqual(['cf_visible'])
  })

  it('filters out archived fields', async () => {
    const fields = [
      makeField({ name: 'cf_active', archived: false }),
      makeField({ name: 'cf_retired', archived: true }),
    ]
    mockFetch(fields)

    const result = await getFormFields('123')
    expect(result.map((f) => f.name)).toEqual(['cf_active'])
  })

  it('filters out fields that are both hidden and archived', async () => {
    const fields = [
      makeField({ name: 'cf_good', displayed_to_customers: true, archived: false }),
      makeField({ name: 'cf_bad', displayed_to_customers: false, archived: true }),
    ]
    mockFetch(fields)

    const result = await getFormFields('123')
    expect(result.map((f) => f.name)).toEqual(['cf_good'])
  })

  it('throws when the API returns a non-ok response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await expect(getFormFields('123')).rejects.toThrow(
      'Freshdesk API error fetching form 123: 401 Unauthorized'
    )
  })

  it('returns an empty array when all fields are filtered out', async () => {
    mockFetch([
      makeField({ displayed_to_customers: false }),
      makeField({ archived: true }),
    ])

    const result = await getFormFields('123')
    expect(result).toEqual([])
  })
})