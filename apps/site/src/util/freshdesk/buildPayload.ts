/**
 * buildPayload
 *
 * Transforms the raw form values from React Hook Form into the shape
 * the Freshdesk tickets API expects (POST /api/v2/tickets).
 *
 * Freshdesk ticket payload structure:
 * {
 *   email: string,          // from default_requester field
 *   subject: string,        // set programmatically via formType — never from user input
 *   description: string,    // generated from the submitted form fields
 *   type: string,           // the Freshdesk ticket type string
 *   custom_fields: {        // all cf_* fields go here, keyed by their full cf_ name
 *     cf_field_name: value,
 *     ...
 *   }
 * }
 *
 * The key split: supported default_* fields become top-level ticket properties,
 * custom_* fields (identified by the cf_ prefix on their name) go into
 * the custom_fields object. This mirrors how Freshdesk stores and routes
 * ticket data internally.
 */

import type { FreshdeskField } from './types';

// Maps default_* Freshdesk field types to their top-level ticket property names.
// These are the only default fields we expect to encounter in customer-facing forms.
const DEFAULT_FIELD_MAP: Partial<Record<FreshdeskField['type'], string>> = {
  default_requester: 'email',
  // default_subject is intentionally omitted — it's set via formType,
  // not from user input, and should never appear in form values.
  // default_description is intentionally omitted. We generate a description
  // summary from all submitted fields so the form does not depend on a
  // Freshdesk-native textarea being rendered.
  // default_company is intentionally omitted. Freshdesk rejects top-level
  // `company` for this account's tickets API, so we do not send it.
};

export interface FreshdeskTicketPayload {
  email?: string;
  subject: string;
  description: string;
  type: string;
  custom_fields: Record<string, unknown>;
}

function formatDescriptionValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => formatDescriptionValue(item))
      .filter((item): item is string => item !== null);
    return items.length > 0 ? items.join(', ') : null;
  }

  return null;
}

function buildDescriptionSummary(
  values: Record<string, unknown>,
  fields: FreshdeskField[],
): string {
  const lines = fields
    .filter(
      (field) =>
        field.type !== 'default_subject' &&
        field.type !== 'default_description' &&
        field.type !== 'default_company',
    )
    .map((field) => {
      const formattedValue = formatDescriptionValue(values[field.name]);
      if (!formattedValue) return null;
      return `${field.label_for_customers}: ${formattedValue}`;
    })
    .filter((line): line is string => line !== null);

  return lines.length > 0 ? lines.join('\n\n') : 'Submitted from website form.';
}

/**
 * @param values - The raw form values object from React Hook Form's handleSubmit.
 *   Keys are field.name values from the Freshdesk field config.
 * @param fields - The filtered field config from getFormFields. Used to determine
 *   how each value should be mapped in the payload.
 * @param formType - The fallback ticket subject and fallback ticket type.
 *   Used as the ticket `subject`, and as `type` only when the form does not
 *   include a Freshdesk default ticket type field.
 */
export function buildPayload(
  values: Record<string, unknown>,
  fields: FreshdeskField[],
  formType: string,
): FreshdeskTicketPayload {
  const ticketTypeField = fields.find(
    (field) => field.type === 'default_ticket_type',
  );
  const selectedTicketType = ticketTypeField
    ? values[ticketTypeField.name]
    : undefined;
  const resolvedTicketType =
    typeof selectedTicketType === 'string' && selectedTicketType !== ''
      ? selectedTicketType
      : formType;

  const payload: FreshdeskTicketPayload = {
    // Subject is always set programmatically from formType.
    // It is never derived from user input, even if default_subject
    // is present in the field config.
    subject:
      resolvedTicketType === formType
        ? formType
        : `Support Needed: ${resolvedTicketType}`,
    description: buildDescriptionSummary(values, fields),
    type: resolvedTicketType,
    custom_fields: {},
  };

  for (const field of fields) {
    const value = values[field.name];

    // Skip fields with no value — don't send empty strings or undefined
    // to Freshdesk as that can trigger validation errors on their end.
    if (value === undefined || value === null || value === '') continue;

    // Skip subject — handled above via formType
    if (field.type === 'default_subject') continue;

    // Ticket type is handled above so the user's selected value can override
    // the form-level fallback when this field exists.
    if (field.type === 'default_ticket_type') continue;

    // Description is handled above via a generated summary.
    if (field.type === 'default_description') continue;

    if (field.name.startsWith('cf_')) {
      // Custom fields go into the custom_fields object, keyed by their
      // full cf_ name. Freshdesk uses this prefix to identify custom fields
      // and route them to the correct ticket field on their end.
      payload.custom_fields[field.name] = value;
    } else {
      // Default fields map to top-level ticket properties via DEFAULT_FIELD_MAP.
      const ticketKey = DEFAULT_FIELD_MAP[field.type];
      if (ticketKey) {
        // TypeScript needs the explicit cast here since we're dynamically
        // setting properties on a typed object.
        (payload as Record<string, unknown>)[ticketKey] = value;
      }
    }
  }

  return payload;
}
