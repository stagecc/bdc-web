import { describe, expect, it } from 'vitest';
import { buildPayload } from './buildPayload';
import type { FreshdeskField } from './types';

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
});

const FORM_TYPE = 'Published Research Submission';

describe('buildPayload', () => {
  it('always sets subject and type from formType', () => {
    const payload = buildPayload({}, [], FORM_TYPE);
    expect(payload.subject).toBe(FORM_TYPE);
    expect(payload.type).toBe(FORM_TYPE);
    expect(payload.description).toBe('Submitted from website form.');
  });

  it('uses the selected default_ticket_type value when present', () => {
    const fields = [
      makeField({ name: 'ticket_type', type: 'default_ticket_type' }),
    ];
    const values = { ticket_type: 'Website Issue' };

    const payload = buildPayload(values, fields, FORM_TYPE);

    expect(payload.subject).toBe('Support Needed: Website Issue');
    expect(payload.type).toBe('Website Issue');
    expect(payload.custom_fields.ticket_type).toBeUndefined();
  });

  it('falls back to formType when default_ticket_type is empty', () => {
    const fields = [
      makeField({ name: 'ticket_type', type: 'default_ticket_type' }),
    ];
    const values = { ticket_type: '' };

    const payload = buildPayload(values, fields, FORM_TYPE);

    expect(payload.type).toBe(FORM_TYPE);
  });

  it('maps cf_ fields into custom_fields', () => {
    const fields = [
      makeField({ name: 'cf_journal_name', type: 'custom_text' }),
      makeField({ name: 'cf_paper_title', type: 'custom_paragraph' }),
    ];
    const values = {
      cf_journal_name: 'Nature',
      cf_paper_title: 'A study of things',
    };

    const payload = buildPayload(values, fields, FORM_TYPE);
    expect(payload.custom_fields).toEqual({
      cf_journal_name: 'Nature',
      cf_paper_title: 'A study of things',
    });
  });

  it('maps default_requester to top-level email', () => {
    const fields = [
      makeField({ name: 'requester', type: 'default_requester' }),
    ];
    const values = { requester: 'user@example.com' };

    const payload = buildPayload(values, fields, FORM_TYPE);
    expect(payload.email).toBe('user@example.com');
    expect(payload.custom_fields.requester).toBeUndefined();
  });

  it('builds description from submitted field labels and values', () => {
    const fields = [
      makeField({
        name: 'requester',
        label_for_customers: 'Email Address',
        type: 'default_requester',
      }),
      makeField({
        name: 'ticket_type',
        label_for_customers: 'Type of Assistance Needed',
        type: 'default_ticket_type',
      }),
      makeField({ name: 'description', type: 'default_description' }),
      makeField({
        name: 'cf_include_logs',
        label_for_customers: 'Include logs',
        type: 'custom_checkbox',
      }),
      makeField({
        name: 'cf_platforms',
        label_for_customers: 'Platforms affected',
        type: 'custom_dropdown',
      }),
      makeField({
        name: 'cf_details',
        label_for_customers: 'Details',
        type: 'custom_paragraph',
      }),
    ];
    const values = {
      requester: 'user@example.com',
      ticket_type: 'Website Issue',
      description: 'This should be ignored',
      cf_include_logs: true,
      cf_platforms: ['Terra', 'Seven Bridges'],
      cf_details: 'Some details here',
    };

    const payload = buildPayload(values, fields, FORM_TYPE);
    expect(payload.description).toBe(
      'Email Address: user@example.com\n\n' +
        'Type of Assistance Needed: Website Issue\n\n' +
        'Include logs: Yes\n\n' +
        'Platforms affected: Terra, Seven Bridges\n\n' +
        'Details: Some details here',
    );
    expect(payload.custom_fields.description).toBeUndefined();
  });

  it('skips default_company because Freshdesk rejects top-level company', () => {
    const fields = [makeField({ name: 'company', type: 'default_company' })];
    const values = { company: 'Acme Corp' };

    const payload = buildPayload(values, fields, FORM_TYPE);
    expect(payload.company).toBeUndefined();
    expect(payload.custom_fields.company).toBeUndefined();
  });

  it('skips default_subject even if present in field config', () => {
    const fields = [makeField({ name: 'subject', type: 'default_subject' })];
    const values = { subject: 'User typed subject' };

    const payload = buildPayload(values, fields, FORM_TYPE);
    // Subject should still be formType, not the user value
    expect(payload.subject).toBe(FORM_TYPE);
    expect(payload.custom_fields.subject).toBeUndefined();
  });

  it('does not include default_ticket_type in custom_fields', () => {
    const fields = [
      makeField({ name: 'ticket_type', type: 'default_ticket_type' }),
    ];
    const values = { ticket_type: 'Login Issue' };

    const payload = buildPayload(values, fields, FORM_TYPE);

    expect(payload.custom_fields).toEqual({});
  });

  it('skips fields with empty string values', () => {
    const fields = [
      makeField({ name: 'cf_optional_field', type: 'custom_text' }),
    ];
    const values = { cf_optional_field: '' };

    const payload = buildPayload(values, fields, FORM_TYPE);
    expect(payload.custom_fields.cf_optional_field).toBeUndefined();
  });

  it('skips fields with undefined values', () => {
    const fields = [
      makeField({ name: 'cf_optional_field', type: 'custom_text' }),
    ];
    const values = { cf_optional_field: undefined };

    const payload = buildPayload(values, fields, FORM_TYPE);
    expect(payload.custom_fields.cf_optional_field).toBeUndefined();
  });

  it('handles a realistic mixed payload correctly', () => {
    const fields = [
      makeField({
        name: 'requester',
        label_for_customers: 'Email Address',
        type: 'default_requester',
      }),
      makeField({
        name: 'ticket_type',
        label_for_customers: 'Type of Assistance Needed',
        type: 'default_ticket_type',
      }),
      makeField({ name: 'description', type: 'default_description' }),
      makeField({ name: 'company', type: 'default_company' }),
      makeField({ name: 'subject', type: 'default_subject' }),
      makeField({
        name: 'cf_journal_name',
        label_for_customers: 'Journal Name',
        type: 'custom_text',
      }),
      makeField({
        name: 'cf_paper_title',
        label_for_customers: 'Paper Title',
        type: 'custom_paragraph',
      }),
      makeField({
        name: 'cf_publication_date',
        label_for_customers: 'Publication Date',
        type: 'custom_date',
      }),
    ];
    const values = {
      requester: 'researcher@university.edu',
      ticket_type: 'Publishing Research',
      description: 'should be ignored',
      company: 'State University',
      subject: 'should be ignored',
      cf_journal_name: 'Nature',
      cf_paper_title: 'A study of things',
      cf_publication_date: '2025-06-01',
    };

    const payload = buildPayload(values, fields, FORM_TYPE);

    expect(payload).toEqual({
      subject: 'Support Needed: Publishing Research',
      description:
        'Email Address: researcher@university.edu\n\n' +
        'Type of Assistance Needed: Publishing Research\n\n' +
        'Journal Name: Nature\n\n' +
        'Paper Title: A study of things\n\n' +
        'Publication Date: 2025-06-01',
      type: 'Publishing Research',
      email: 'researcher@university.edu',
      custom_fields: {
        cf_journal_name: 'Nature',
        cf_paper_title: 'A study of things',
        cf_publication_date: '2025-06-01',
      },
    });
  });
});
