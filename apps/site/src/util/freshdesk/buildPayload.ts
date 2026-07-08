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
 *   description: string,    // from default_description field
 *   company: string,        // from default_company field
 *   type: string,           // the Freshdesk ticket type string (e.g. "Usage Costs/Cloud Credits")
 *   custom_fields: {        // all cf_* fields go here, keyed by their full cf_ name
 *     cf_field_name: value,
 *     ...
 *   }
 * }
 *
 * The key split: default_* fields become top-level ticket properties,
 * custom_* fields (identified by the cf_ prefix on their name) go into
 * the custom_fields object. This mirrors how Freshdesk stores and routes
 * ticket data internally.
 */

import type { FreshdeskField } from './types';

// Maps default_* Freshdesk field types to their top-level ticket property names.
// These are the only default fields we expect to encounter in customer-facing forms.
const DEFAULT_FIELD_MAP: Partial<Record<FreshdeskField['type'], string>> = {
  default_requester: 'email',
  default_description: 'description',
  default_company: 'company',
  // default_subject is intentionally omitted — it's set via formType,
  // not from user input, and should never appear in form values.
};

export interface FreshdeskTicketPayload {
  email?: string;
  subject: string;
  description?: string;
  company?: string;
  type: string;
  custom_fields: Record<string, unknown>;
}

/**
 * @param values - The raw form values object from React Hook Form's handleSubmit.
 *   Keys are field.name values from the Freshdesk field config.
 * @param fields - The filtered field config from getFormFields. Used to determine
 *   how each value should be mapped in the payload.
 * @param formType - The Freshdesk ticket type string for this form
 *   (e.g. "Usage Costs/Cloud Credits"). Used as both the ticket `type`
 *   and the ticket `subject`, since subject is not collected from the user.
 */
export function buildPayload(
  values: Record<string, unknown>,
  fields: FreshdeskField[],
  formType: string,
): FreshdeskTicketPayload {
  const payload: FreshdeskTicketPayload = {
    // Subject is always set programmatically from formType.
    // It is never derived from user input, even if default_subject
    // is present in the field config.
    subject: formType,
    type: formType,
    custom_fields: {},
  };

  for (const field of fields) {
    const value = values[field.name];

    // Skip fields with no value — don't send empty strings or undefined
    // to Freshdesk as that can trigger validation errors on their end.
    if (value === undefined || value === null || value === '') continue;

    // Skip subject — handled above via formType
    if (field.type === 'default_subject') continue;

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
