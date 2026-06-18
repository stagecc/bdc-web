import { describe, it, expect } from 'vitest'
import { buildPayload } from './buildPayload'
import type { FreshdeskField } from './types'

// Minimal field factory for buildPayload tests.
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

const FORM_TYPE = 'Published Research Submission'

describe('buildPayload', () => {
  it('always sets subject and type from formType', () => {
    const payload = buildPayload({}, [], FORM_TYPE)
    expect(payload.subject).toBe(FORM_TYPE)
    expect(payload.type).toBe(FORM_TYPE)
  })

  it('maps cf_ fields into custom_fields', () => {
    const fields = [
      makeField({ name: 'cf_journal_name', type: 'custom_text' }),
      makeField({ name: 'cf_paper_title', type: 'custom_paragraph' }),
    ]
    const values = {
      cf_journal_name: 'Nature',
      cf_paper_title: 'A study of things',
    }

    const payload = buildPayload(values, fields, FORM_TYPE)
    expect(payload.custom_fields).toEqual({
      cf_journal_name: 'Nature',
      cf_paper_title: 'A study of things',
    })
  })

  it('maps default_requester to top-level email', () => {
    const fields = [makeField({ name: 'requester', type: 'default_requester' })]
    const values = { requester: 'user@example.com' }

    const payload = buildPayload(values, fields, FORM_TYPE)
    expect(payload.email).toBe('user@example.com')
    expect(payload.custom_fields['requester']).toBeUndefined()
  })

  it('maps default_description to top-level description', () => {
    const fields = [makeField({ name: 'description', type: 'default_description' })]
    const values = { description: 'Some details here' }

    const payload = buildPayload(values, fields, FORM_TYPE)
    expect(payload.description).toBe('Some details here')
    expect(payload.custom_fields['description']).toBeUndefined()
  })

  it('maps default_company to top-level company', () => {
    const fields = [makeField({ name: 'company', type: 'default_company' })]
    const values = { company: 'Acme Corp' }

    const payload = buildPayload(values, fields, FORM_TYPE)
    expect(payload.company).toBe('Acme Corp')
    expect(payload.custom_fields['company']).toBeUndefined()
  })

  it('skips default_subject even if present in field config', () => {
    const fields = [makeField({ name: 'subject', type: 'default_subject' })]
    const values = { subject: 'User typed subject' }

    const payload = buildPayload(values, fields, FORM_TYPE)
    // Subject should still be formType, not the user value
    expect(payload.subject).toBe(FORM_TYPE)
    expect(payload.custom_fields['subject']).toBeUndefined()
  })

  it('skips fields with empty string values', () => {
    const fields = [makeField({ name: 'cf_optional_field', type: 'custom_text' })]
    const values = { cf_optional_field: '' }

    const payload = buildPayload(values, fields, FORM_TYPE)
    expect(payload.custom_fields['cf_optional_field']).toBeUndefined()
  })

  it('skips fields with undefined values', () => {
    const fields = [makeField({ name: 'cf_optional_field', type: 'custom_text' })]
    const values = { cf_optional_field: undefined }

    const payload = buildPayload(values, fields, FORM_TYPE)
    expect(payload.custom_fields['cf_optional_field']).toBeUndefined()
  })

  it('handles a realistic mixed payload correctly', () => {
    const fields = [
      makeField({ name: 'requester', type: 'default_requester' }),
      makeField({ name: 'description', type: 'default_description' }),
      makeField({ name: 'company', type: 'default_company' }),
      makeField({ name: 'subject', type: 'default_subject' }),
      makeField({ name: 'cf_journal_name', type: 'custom_text' }),
      makeField({ name: 'cf_paper_title', type: 'custom_paragraph' }),
      makeField({ name: 'cf_publication_date', type: 'custom_date' }),
    ]
    const values = {
      requester: 'researcher@university.edu',
      description: 'Submitting my paper for the record.',
      company: 'State University',
      subject: 'should be ignored',
      cf_journal_name: 'Nature',
      cf_paper_title: 'A study of things',
      cf_publication_date: '2025-06-01',
    }

    const payload = buildPayload(values, fields, FORM_TYPE)

    expect(payload).toEqual({
      subject: FORM_TYPE,
      type: FORM_TYPE,
      email: 'researcher@university.edu',
      description: 'Submitting my paper for the record.',
      company: 'State University',
      custom_fields: {
        cf_journal_name: 'Nature',
        cf_paper_title: 'A study of things',
        cf_publication_date: '2025-06-01',
      },
    })
  })
})