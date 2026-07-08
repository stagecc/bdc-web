/**
 * getCustomObjectSchema
 *
 * Fetches a custom object schema's field definitions from the Freshdesk
 * custom objects API at build time (called from Astro page frontmatter,
 * never client-side).
 *
 * Why build time?
 *   - Keeps the Freshdesk API key server-side only — never exposed to the browser
 *   - Bakes field config into the page as props — no client fetch, no loading flicker
 *   - Fails fast at build if the API is unreachable, rather than silently at runtime
 *
 * Relationship to getFormFields:
 *   This utility serves the same purpose as getFormFields but for custom
 *   object schemas rather than ticket forms. The key differences:
 *   - No per-field enrichment needed — choices are already included in the
 *     schema response (unlike ticket forms which require separate per-field fetches)
 *   - No dynamic sections to resolve — custom objects don't support them natively
 *   - Field filtering uses `visible` and `deleted` instead of
 *     `displayed_to_customers` and `archived`
 *   - PRIMARY fields are always excluded from the rendered form — they are
 *     set programmatically by buildCustomObjectPayload, never from user input
 *
 * The caller (Astro frontmatter) is responsible for catching errors and passing
 * an error prop to the form component so it can render the fallback UI.
 */

import type {
  CustomObjectField,
  CustomObjectSchema,
} from './typesCustomObjects';

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

// These are injected at build time via Astro/Vite's env system.
// In Astro, environment variables are accessed via import.meta.env,
// not process.env. Variables must be defined in .env at the repo root.
const FRESHDESK_DOMAIN = import.meta.env.FRESHDESK_DOMAIN;
const FRESHDESK_API_KEY = import.meta.env.FRESHDESK_API_KEY;

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

/**
 * Builds the Basic Auth header value for Freshdesk API requests.
 *
 * Freshdesk uses HTTP Basic auth where the API key is the username
 * and the password is literally the string "X" — this is their convention,
 * not a placeholder. See: https://developers.freshdesk.com/api/#authentication
 */
function getAuthHeader(): string {
  return `Basic ${btoa(`${FRESHDESK_API_KEY}:X`)}`;
}

// ---------------------------------------------------------------------------
// Field filter
// ---------------------------------------------------------------------------

/**
 * Returns true if a custom object field should be included in the rendered form.
 *
 * Excludes:
 *   - visible: false — fields hidden from the record view
 *   - deleted: true — soft-deleted fields still present in the API response
 *   - type PRIMARY — the record identifier, always set programmatically
 *     by buildCustomObjectPayload, never collected from user input
 *   - type RELATIONSHIP where field_options.related_object_type is NATIVE —
 *     native object relationships (contacts, tickets, companies) require
 *     a lookup flow not yet implemented. Custom-to-custom relationships
 *     are rendered based on ui_hint.
 *
 * Note: Unlike ticket forms, there is no `displayed_to_customers` equivalent.
 * All visible, non-deleted, non-PRIMARY fields are included in the form.
 */
function isVisibleField(field: CustomObjectField): boolean {
  if (!field.visible || field.deleted) return false;
  if (field.type === 'PRIMARY') return false;
  if (
    field.type === 'RELATIONSHIP' &&
    field.field_options.related_object_type === 'NATIVE'
  )
    return false;
  return true;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetches and filters the field definitions for a custom object schema.
 *
 * @param schemaId - The numeric ID of the custom object schema.
 *   Stored in .env as FRESHDESK_CUSTOM_OBJECT_{NAME}_SCHEMA_ID.
 *   Obtain by calling GET /api/v2/custom_objects/schemas and noting the `id`.
 * @returns Filtered array of CustomObjectField objects ready to pass as props
 *   to the form component. PRIMARY and hidden fields are excluded.
 * @throws If the Freshdesk API returns a non-ok response.
 */
export async function getCustomObjectSchema(
  schemaId: string | number,
): Promise<CustomObjectField[]> {
  const response = await fetch(
    `https://${FRESHDESK_DOMAIN}/api/v2/custom_objects/schemas/${schemaId}`,
    {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Freshdesk API error fetching custom object schema ${schemaId}: ` +
        `${response.status} ${response.statusText}`,
    );
  }

  const schema: CustomObjectSchema = await response.json();

  return schema.fields.filter(isVisibleField);
}
