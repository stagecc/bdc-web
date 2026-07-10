/**
 * buildCustomObjectPayload
 *
 * Transforms the raw form values from React Hook Form into the shape
 * the Freshdesk custom objects API expects when creating a record:
 *
 * POST /api/v2/custom_objects/schemas/{schema_id}/records/
 * {
 *   "data": {
 *     "submission_id": "PUB-3F9A2C1D",   ← generated, not from user input
 *     "title": "A study of things",
 *     "journal": "Nature",
 *     "research_community": ["Heart", "Lung"],  ← MULTI_SELECT as array
 *     ...
 *   }
 * }
 *
 * Key differences from buildPayload (ticket forms):
 *   - All fields go into a single `data` object — no top-level vs custom_fields split
 *   - No cf_ prefix detection — field names are plain strings
 *   - No subject, type, or email top-level properties
 *   - PRIMARY field value (submission ID) is generated here, not from user input
 *   - MULTI_SELECT values are arrays of strings, not single values
 *   - recaptcha_token is added by DynamicCustomObjectForm after this runs, same as
 *     ticket forms
 *
 * Submission ID generation:
 *   The PRIMARY field uniquely identifies each record. We generate a short
 *   random ID here since Freshdesk doesn't auto-generate primary field values.
 *   Format: "PUB-{8 random hex chars}" e.g. "PUB-3F9A2C1D"
 *
 *   TODO: Move ID generation into the Lambda proxy for better security and
 *   consistency. The Lambda sits server-side and can guarantee uniqueness
 *   more reliably than client-generated IDs.
 *
 * MULTI_SELECT handling:
 *   React Hook Form returns checkbox group values as arrays when multiple
 *   boxes are checked. These are passed through as-is since Freshdesk
 *   expects MULTI_SELECT values as string arrays.
 *   Single unchecked checkboxes (custom_checkbox / boolean fields) are
 *   passed through as booleans.
 */

import type { CustomObjectField } from './typesCustomObjects';

// ---------------------------------------------------------------------------
// Submission ID generation
// ---------------------------------------------------------------------------

/**
 * Generates a short random submission ID for the PRIMARY field.
 *
 * Format: "PUB-{8 uppercase hex chars}" e.g. "PUB-3F9A2C1D"
 *
 * Uses crypto.getRandomValues for cryptographically random values,
 * available in both browser and Node/Deno environments.
 *
 * TODO: Move into the Lambda proxy before launch. See file comment above.
 */
function generateSubmissionId(prefix: string = 'PUB'): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `${prefix}-${hex}`;
}

// ---------------------------------------------------------------------------
// Payload type
// ---------------------------------------------------------------------------

export interface CustomObjectRecordPayload {
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Builds a custom object record payload from React Hook Form values.
 *
 * @param values - Raw form values from React Hook Form's handleSubmit.
 *   Keys are field.name values from the custom object schema.
 * @param fields - The filtered field config from getCustomObjectSchema.
 *   Used to identify field types and skip fields that shouldn't be submitted.
 * @param primaryFieldName - The name of the PRIMARY field in the schema.
 *   Defaults to 'name' since Freshdesk always names the primary field 'name'.
 *   The submission ID is generated and inserted under this key.
 * @param idPrefix - Prefix for the generated submission ID. Defaults to 'PUB'.
 *   Override per form type (e.g. 'CC' for cloud credits, 'JOIN' for join).
 * @returns A payload object ready to POST to the custom objects records endpoint.
 */
export function buildCustomObjectPayload(
  values: Record<string, unknown>,
  fields: CustomObjectField[],
  primaryFieldName: string = 'name',
  idPrefix: string = 'PUB',
): CustomObjectRecordPayload {
  const data: Record<string, unknown> = {
    // Generate and insert the PRIMARY field value.
    // This is never collected from user input — the form never renders
    // PRIMARY fields (filtered out by getCustomObjectSchema).
    [primaryFieldName]: generateSubmissionId(idPrefix),
  };

  for (const field of fields) {
    const value = values[field.name];

    // Skip PRIMARY fields — already handled above
    if (field.type === 'PRIMARY') continue;

    // Skip empty values — don't send null/undefined/empty strings to Freshdesk
    // as they can trigger unexpected validation errors
    if (value === undefined || value === null || value === '') continue;

    // MULTI_SELECT fields expect an array of strings.
    // React Hook Form returns checkbox groups as arrays when multiple
    // options are selected, so we pass them through directly.
    // Guard against non-array values just in case.
    if (field.type === 'MULTI_SELECT') {
      data[field.name] = Array.isArray(value) ? value : [value];
      continue;
    }

    // All other field types — pass value through as-is.
    // Freshdesk handles type coercion for DATE, NUMBER, DECIMAL, CHECKBOX.
    data[field.name] = value;
  }

  return { data };
}
