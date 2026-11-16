import { describe, expect, it } from 'vitest';
import type { FreshdeskField } from './freshdesk/types';
import type { CustomObjectField } from './freshdesk/typesCustomObjects';
import {
  getDynamicSectionSelectionsFromPrefill,
  getFormPrefillValuesFromSearch,
} from './formPrefill';

const makeFreshdeskField = (
  overrides: Partial<FreshdeskField>,
): FreshdeskField => ({
  id: 1,
  name: 'cf_test_field',
  label_for_customers: 'Test Field',
  type: 'custom_text',
  required_for_customers: false,
  displayed_to_customers: true,
  archived: false,
  ...overrides,
});

const makeCustomObjectField = (
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

describe('getFormPrefillValuesFromSearch', () => {
  it('returns supported Freshdesk text and select values keyed by field name', () => {
    const fields = [
      makeFreshdeskField({ name: 'requester', type: 'default_requester' }),
      makeFreshdeskField({ name: 'cf_project_name', type: 'custom_text' }),
      makeFreshdeskField({
        name: 'ticket_type',
        type: 'default_ticket_type',
        choices: [
          {
            id: 1,
            label: 'Website Issue',
            value: 'Website Issue',
            position: 1,
            parent_choice_id: 0,
            choices: [],
          },
        ],
      }),
    ];

    const prefillValues = getFormPrefillValuesFromSearch(
      fields,
      '?requester=user@example.com&cf_project_name=Cardio%20Study&ticket_type=Website%20Issue',
    );

    expect(prefillValues).toEqual({
      requester: 'user@example.com',
      cf_project_name: 'Cardio Study',
      ticket_type: 'Website Issue',
    });
  });

  it('ignores unknown parameters, blank values, and unsupported field types', () => {
    const fields = [
      makeFreshdeskField({ name: 'cf_project_name', type: 'custom_text' }),
      makeFreshdeskField({ name: 'cf_requested_date', type: 'custom_date' }),
    ];

    const prefillValues = getFormPrefillValuesFromSearch(
      fields,
      '?cf_project_name=%20%20%20&cf_requested_date=2026-11-13&unknown=value',
    );

    expect(prefillValues).toEqual({});
  });

  it('supports Freshdesk paragraph fields', () => {
    const fields = [
      makeFreshdeskField({ name: 'cf_subject', type: 'custom_text' }),
      makeFreshdeskField({
        name: 'cf_submitted_description',
        type: 'custom_paragraph',
      }),
    ];

    const prefillValues = getFormPrefillValuesFromSearch(
      fields,
      '?cf_subject=Need%20help&cf_submitted_description=Detailed%20problem%20description',
    );

    expect(prefillValues).toEqual({
      cf_subject: 'Need help',
      cf_submitted_description: 'Detailed problem description',
    });
  });

  it('skips select values that do not match an allowed choice', () => {
    const fields = [
      makeFreshdeskField({
        name: 'ticket_type',
        type: 'default_ticket_type',
        choices: [
          {
            id: 1,
            label: 'Website Issue',
            value: 'Website Issue',
            position: 1,
            parent_choice_id: 0,
            choices: [],
          },
        ],
      }),
    ];

    const prefillValues = getFormPrefillValuesFromSearch(
      fields,
      '?ticket_type=Something%20Else',
    );

    expect(prefillValues).toEqual({});
  });

  it('supports custom object TEXT, PARAGRAPH, and DROPDOWN fields', () => {
    const fields = [
      makeCustomObjectField({ name: 'title', type: 'TEXT' }),
      makeCustomObjectField({
        name: 'research_area',
        type: 'DROPDOWN',
        choices: [{ id: 1, value: 'Genomics', position: 1 }],
      }),
      makeCustomObjectField({ name: 'abstract', type: 'PARAGRAPH' }),
    ];

    const prefillValues = getFormPrefillValuesFromSearch(
      fields,
      '?title=A%20study%20of%20things&research_area=Genomics&abstract=Longer%20summary',
    );

    expect(prefillValues).toEqual({
      title: 'A study of things',
      research_area: 'Genomics',
      abstract: 'Longer summary',
    });
  });
});

describe('getDynamicSectionSelectionsFromPrefill', () => {
  it('returns prefilled values for section-driving dropdowns', () => {
    const fields = [
      makeFreshdeskField({
        name: 'ticket_type',
        type: 'default_ticket_type',
        has_section: true,
      }),
      makeFreshdeskField({
        name: 'cf_request_type',
        type: 'custom_dropdown',
        has_section: true,
      }),
      makeFreshdeskField({ name: 'cf_project_name', type: 'custom_text' }),
    ];

    const sectionSelections = getDynamicSectionSelectionsFromPrefill(fields, {
      ticket_type: 'Website Issue',
      cf_request_type: 'Access',
      cf_project_name: 'Ignored',
    });

    expect(sectionSelections).toEqual({
      ticket_type: 'Website Issue',
      cf_request_type: 'Access',
    });
  });

  it('ignores fields without sections or without prefilled values', () => {
    const fields = [
      makeFreshdeskField({
        name: 'ticket_type',
        type: 'default_ticket_type',
        has_section: true,
      }),
      makeFreshdeskField({
        name: 'cf_request_type',
        type: 'custom_dropdown',
      }),
    ];

    const sectionSelections = getDynamicSectionSelectionsFromPrefill(fields, {
      cf_request_type: 'Access',
    });

    expect(sectionSelections).toEqual({});
  });
});
