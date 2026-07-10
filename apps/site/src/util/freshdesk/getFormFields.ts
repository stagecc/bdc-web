/**
 * getFormFields
 *
 * Fetches and enriches form field configuration from the Freshdesk ticket
 * forms API at build time (called from Astro page frontmatter, never client-side).
 *
 * Why build time?
 *   - Keeps the Freshdesk API key server-side only — never exposed to the browser
 *   - Bakes field config into the page as props — no client fetch, no loading flicker
 *   - Fails fast at build if the API is unreachable, rather than silently at runtime
 *
 * The caller (Astro frontmatter) is responsible for catching errors and passing
 * an error prop to DynamicForm so it can render the fallback UI instead of
 * a broken or empty form.
 *
 * Enrichment pipeline:
 *   1. Fetch GET /api/v2/ticket-forms/{id}?include=section
 *      Always includes ?include=section so section data is available for any
 *      form that uses dynamic sections. For forms without sections, the
 *      sections array will simply be empty or absent — no harm done.
 *
 *   2. Filter fields to displayed_to_customers && !archived
 *      Agent-only and retired fields are excluded before any further processing.
 *
 *   3. Fetch choices for dropdown fields
 *      Fields with type custom_dropdown or default_ticket_type require a
 *      separate per-field request to get their choices array. These are
 *      fetched in parallel (Promise.all) to minimize build time.
 *      See fetchFieldChoices() for details.
 *
 *   4. Resolve dynamic sections onto their parent dropdown fields
 *      The raw API response returns sections at the top level with
 *      ticket_field_ids as raw numbers. We resolve those IDs to full field
 *      objects and attach the resolved sections directly to their parent
 *      dropdown field. DynamicForm never needs to cross-reference IDs.
 *      See resolveSections() for details.
 */

import type {
  FreshdeskField,
  FreshdeskFormResponse,
  FreshdeskSection,
} from './types';

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
 * Returns true if a field should be included in the rendered form.
 *
 * Excludes:
 *   - displayed_to_customers: false — agent-only fields, never shown to users
 *   - archived: true — retired fields that may still exist in the API response
 *
 * Note: default_subject passes this filter (displayed_to_customers is true)
 * but is rendered as a hidden input by DynamicForm — it's set programmatically
 * via the formType prop and never shown to the user.
 */
function isVisibleField(field: FreshdeskField): boolean {
  return field.displayed_to_customers && !field.archived;
}

// ---------------------------------------------------------------------------
// Choices fetching
// ---------------------------------------------------------------------------

/**
 * Returns true if a field type requires choices to be fetched separately.
 *
 * The main form endpoint (GET /api/v2/ticket-forms/{id}) does not return
 * choices for dropdown fields — a separate per-field request is required.
 * This applies to both custom dropdowns and the default ticket type field.
 */
function needsChoices(field: FreshdeskField): boolean {
  return (
    field.type === 'custom_dropdown' || field.type === 'default_ticket_type'
  );
}

/**
 * Fetches choices for a single dropdown field via the per-field endpoint.
 *
 * GET /api/v2/ticket-forms/{formId}/fields/{fieldId}
 *
 * Returns the field with its choices array populated.
 * If the fetch fails, logs a warning and returns the field unchanged
 * rather than failing the entire form build.
 */
async function fetchFieldChoices(
  formId: string,
  field: FreshdeskField,
): Promise<FreshdeskField> {
  try {
    const response = await fetch(
      `https://${FRESHDESK_DOMAIN}/api/v2/ticket-forms/${formId}/fields/${field.id}`,
      {
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      console.warn(
        `getFormFields: failed to fetch choices for field "${field.name}" ` +
          `(${field.id}): ${response.status} ${response.statusText}`,
      );
      return field;
    }

    const enriched = await response.json();

    // Merge choices from the per-field response into the field object.
    // All other field properties come from the original form-level response.
    return { ...field, choices: enriched.choices ?? [] };
  } catch (err) {
    console.warn(
      `getFormFields: error fetching choices for field "${field.name}":`,
      err,
    );
    return field;
  }
}

// ---------------------------------------------------------------------------
// Section resolution
// ---------------------------------------------------------------------------

/**
 * Resolves raw sections from the API response onto their parent dropdown fields.
 *
 * The Freshdesk API returns sections at the top level of the form response
 * (when ?include=section is used), with child fields represented as raw
 * ticket_field_ids (numbers). This function:
 *
 *   1. Builds a lookup map of all fields by ID for efficient resolution
 *   2. For each raw section, resolves ticket_field_ids to full field objects
 *   3. Attaches the resolved sections to their parent dropdown field
 *
 * After this step, DynamicForm can render conditional sections without
 * ever needing to cross-reference field IDs — everything is self-contained
 * in the parent field's sections array.
 *
 * Fields that belong to sections are intentionally kept in the top-level
 * fields array as well. DynamicForm is responsible for skipping them
 * during normal rendering — they should only appear when their parent
 * section is triggered by a dropdown selection.
 *
 * @param fields - The filtered, enriched top-level fields array
 * @param rawSections - The raw sections from the API response (ticket_field_ids as numbers)
 * @returns Updated fields array with sections attached to parent dropdown fields
 */
function resolveSections(
  fields: FreshdeskField[],
  rawSections: Omit<FreshdeskSection, 'fields'>[],
): FreshdeskField[] {
  if (!rawSections.length) return fields;

  // Build a lookup map so we can resolve field IDs to objects in O(1)
  const fieldById = new Map<number, FreshdeskField>(
    fields.map((f) => [f.id, f]),
  );

  // Group resolved sections by their parent dropdown field ID
  const sectionsByParentId = new Map<number, FreshdeskSection[]>();

  for (const rawSection of rawSections) {
    // Resolve ticket_field_ids to full field objects.
    // Fields that don't pass the visibility filter won't be in fieldById,
    // so they're naturally excluded here.
    const resolvedFields = rawSection.ticket_field_ids
      .map((id) => fieldById.get(id))
      .filter((f): f is FreshdeskField => f !== undefined);

    const resolvedSection: FreshdeskSection = {
      ...rawSection,
      fields: resolvedFields,
    };

    const parentId = rawSection.parent_ticket_field_id;
    const existing = sectionsByParentId.get(parentId) ?? [];
    sectionsByParentId.set(parentId, [...existing, resolvedSection]);
  }

  // Attach resolved sections to their parent dropdown fields.
  // Non-dropdown fields and dropdowns with no sections are returned unchanged.
  return fields.map((field) => {
    const sections = sectionsByParentId.get(field.id);
    if (!sections) return field;
    return { ...field, sections };
  });
}

// ---------------------------------------------------------------------------
// Collect section field IDs
// ---------------------------------------------------------------------------

/**
 * Returns the set of field IDs that belong to any dynamic section.
 *
 * Used by DynamicForm to skip section-owned fields during normal top-level
 * rendering — those fields should only appear when their parent section
 * is triggered by a dropdown selection, not as standalone form fields.
 *
 * Exported so DynamicForm can use it without reimplementing the logic.
 */
export function getSectionFieldIds(fields: FreshdeskField[]): Set<number> {
  const ids = new Set<number>();
  for (const field of fields) {
    if (field.sections) {
      for (const section of field.sections) {
        for (const sectionField of section.fields) {
          ids.add(sectionField.id);
        }
      }
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function getFormFields(formId: string): Promise<FreshdeskField[]> {
  // Always include sections — forms without sections return an empty or absent
  // sections array, so this param is safe to include on all requests.
  const response = await fetch(
    `https://${FRESHDESK_DOMAIN}/api/v2/ticket-forms/${formId}?include=section`,
    {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Freshdesk API error fetching form ${formId}: ${response.status} ${response.statusText}`,
    );
  }

  const form: FreshdeskFormResponse = await response.json();

  // Step 1 — Filter to visible, non-archived fields only
  const visibleFields = form.fields.filter(isVisibleField);

  // Step 2 — Fetch choices for dropdown fields in parallel
  // Promise.all preserves field order while fetching concurrently,
  // minimizing the total build time cost of the per-field requests.
  const enrichedFields = await Promise.all(
    visibleFields.map((field) =>
      needsChoices(field)
        ? fetchFieldChoices(formId, field)
        : Promise.resolve(field),
    ),
  );

  // Step 3 — Resolve sections onto parent dropdown fields.
  // Sections can come from two places in the Freshdesk API response:
  //   1. Top-level form.sections (when ?include=section puts them there)
  //   2. Already nested on individual fields (observed in real API responses)
  // We collect from both sources to handle either case.
  const topLevelSections = form.sections ?? [];
  const fieldLevelSections = enrichedFields
    .filter((f) => f.sections?.length)
    .flatMap((f) => f.sections as Omit<FreshdeskSection, 'fields'>[]);

  const rawSections = [...topLevelSections, ...fieldLevelSections];
  const finalFields = resolveSections(enrichedFields, rawSections);
  return finalFields;
}
