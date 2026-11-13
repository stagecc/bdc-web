import type { FreshdeskField } from './freshdesk/types';
import type { CustomObjectField } from './freshdesk/typesCustomObjects';

type PrefillField = FreshdeskField | CustomObjectField;

const SUPPORTED_FRESHDESK_TEXT_TYPES = new Set([
  'default_requester',
  'default_company',
  'custom_text',
] satisfies FreshdeskField['type'][]);

const SUPPORTED_FRESHDESK_SELECT_TYPES = new Set([
  'default_ticket_type',
  'custom_dropdown',
] satisfies FreshdeskField['type'][]);

const SUPPORTED_CUSTOM_OBJECT_TEXT_TYPES = new Set([
  'TEXT',
] satisfies CustomObjectField['type'][]);

const SUPPORTED_CUSTOM_OBJECT_SELECT_TYPES = new Set([
  'DROPDOWN',
] satisfies CustomObjectField['type'][]);

function getTrimmedParamValue(
  params: URLSearchParams,
  name: string,
): string | null {
  const value = params.get(name);

  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function isFreshdeskField(field: PrefillField): field is FreshdeskField {
  return 'label_for_customers' in field;
}

function isSupportedTextField(field: PrefillField): boolean {
  if (isFreshdeskField(field)) {
    return SUPPORTED_FRESHDESK_TEXT_TYPES.has(field.type);
  }

  return SUPPORTED_CUSTOM_OBJECT_TEXT_TYPES.has(field.type);
}

function isSupportedSelectField(field: PrefillField): boolean {
  if (isFreshdeskField(field)) {
    return SUPPORTED_FRESHDESK_SELECT_TYPES.has(field.type);
  }

  return SUPPORTED_CUSTOM_OBJECT_SELECT_TYPES.has(field.type);
}

function getAllowedSelectValues(field: PrefillField): string[] {
  if (!('choices' in field) || !field.choices?.length) {
    return [];
  }

  return field.choices.map((choice) => choice.value);
}

export function getFormPrefillValuesFromSearch(
  fields: PrefillField[],
  search: string,
): Record<string, string> {
  const params = new URLSearchParams(search);
  const prefillValues: Record<string, string> = {};

  for (const field of fields) {
    const value = getTrimmedParamValue(params, field.name);

    if (value == null) {
      continue;
    }

    if (isSupportedTextField(field)) {
      prefillValues[field.name] = value;
      continue;
    }

    if (!isSupportedSelectField(field)) {
      continue;
    }

    const allowedValues = getAllowedSelectValues(field);

    if (allowedValues.includes(value)) {
      prefillValues[field.name] = value;
    }
  }

  return prefillValues;
}

export function getDynamicSectionSelectionsFromPrefill(
  fields: FreshdeskField[],
  prefillValues: Record<string, string>,
): Record<string, string> {
  const sectionSelections: Record<string, string> = {};

  for (const field of fields) {
    if (!field.has_section || !prefillValues[field.name]) {
      continue;
    }

    sectionSelections[field.name] = prefillValues[field.name];
  }

  return sectionSelections;
}
