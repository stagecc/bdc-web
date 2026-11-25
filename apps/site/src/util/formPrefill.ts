import type { FreshdeskField } from './freshdesk/types';
import type { CustomObjectField } from './freshdesk/typesCustomObjects';

type PrefillField = FreshdeskField | CustomObjectField;

const SUPPORTED_FRESHDESK_TEXT_TYPES = new Set([
  'default_requester',
  'default_company',
  'custom_text',
  'custom_paragraph',
] satisfies FreshdeskField['type'][]);

const SUPPORTED_FRESHDESK_SELECT_TYPES = new Set([
  'default_ticket_type',
  'custom_dropdown',
] satisfies FreshdeskField['type'][]);

const SUPPORTED_CUSTOM_OBJECT_TEXT_TYPES = new Set([
  'TEXT',
  'PARAGRAPH',
] satisfies CustomObjectField['type'][]);

const SUPPORTED_CUSTOM_OBJECT_SELECT_TYPES = new Set([
  'DROPDOWN',
] satisfies CustomObjectField['type'][]);

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

function shouldApplyPrefillFieldValue(
  field: PrefillField,
  value: string,
): boolean {
  if (isSupportedTextField(field)) {
    return true;
  }

  if (!isSupportedSelectField(field)) {
    return false;
  }

  const allowedValues = getAllowedSelectValues(field);

  return allowedValues.includes(value);
}

function normalizePrefillDate(value: string): string | undefined {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (!iso && !us) return undefined;

  const year = Number(iso ? iso[1] : us?.[3]);
  const month = Number(iso ? iso[2] : us?.[1]);
  const day = Number(iso ? iso[3] : us?.[2]);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    year < 1 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return undefined;

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface FormPrefillResult {
  prefillValues: Record<string, string>;
  skippedFieldNames: string[];
}

export function getFormPrefillResultFromSearch(
  fields: PrefillField[],
  search: string,
): FormPrefillResult {
  const params = new URLSearchParams(search);
  const fieldsByName = new Map(fields.map((field) => [field.name, field]));
  const prefillValues: Record<string, string> = {};
  const skippedFieldNames = new Set<string>();

  for (const [name, rawValue] of params.entries()) {
    const trimmedValue = rawValue.trim();

    if (trimmedValue === '') {
      continue;
    }

    const field = fieldsByName.get(name);

    if (!field) {
      continue;
    }

    const value =
      field.type === 'custom_date' || field.type === 'DATE'
        ? normalizePrefillDate(trimmedValue)
        : shouldApplyPrefillFieldValue(field, trimmedValue)
          ? trimmedValue
          : undefined;

    if (value !== undefined) {
      prefillValues[field.name] = value;
      skippedFieldNames.delete(field.name);
      continue;
    }

    skippedFieldNames.add(field.name);
  }

  return {
    prefillValues,
    skippedFieldNames: Array.from(skippedFieldNames),
  };
}

export function getFormPrefillValuesFromSearch(
  fields: PrefillField[],
  search: string,
): Record<string, string> {
  return getFormPrefillResultFromSearch(fields, search).prefillValues;
}

export function getSkippedFormPrefillFieldNamesFromSearch(
  fields: PrefillField[],
  search: string,
): string[] {
  return getFormPrefillResultFromSearch(fields, search).skippedFieldNames;
}

export function clearPrefillUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.hash,
  );
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
