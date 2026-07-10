/**
 * Types for the Freshdesk Custom Objects API.
 *
 * These mirror the shape returned by:
 *   GET /api/v2/custom_objects/schemas              — list all schemas
 *   GET /api/v2/custom_objects/schemas/{id}         — single schema with fields
 *   GET /api/v2/custom_objects/schemas/{id}/records — records for a schema
 *
 * Custom objects differ from ticket forms in several key ways:
 *   - Field types are uppercase strings (TEXT, PARAGRAPH, DATE, etc.)
 *     rather than the prefixed convention used by ticket forms
 *     (e.g. custom_text, default_requester)
 *   - `required` is a direct boolean, not `required_for_customers`
 *   - `visible` replaces `displayed_to_customers`
 *   - `deleted` replaces `archived`
 *   - Choices have `value` but no separate `label` — value serves both purposes
 *   - No dynamic sections — the "Other" free text pattern is handled
 *     client-side in React components, not via Freshdesk sections
 *
 * The cf_ prefix convention does not apply to custom object fields —
 * field names are plain strings (e.g. "title", "research_area").
 * See buildCustomObjectPayload.ts for how this affects payload construction.
 */

// ---------------------------------------------------------------------------
// Field types
// ---------------------------------------------------------------------------

/**
 * All possible field types for custom object fields supported by the renderer.
 *
 * UI component mapping:
 *   PRIMARY      → excluded by getCustomObjectSchema, set programmatically
 *   TEXT         → TextField
 *   PARAGRAPH    → TextareaField
 *   DATE         → DateField (Trussworks DatePicker)
 *   DROPDOWN     → SelectField
 *   CHECKBOX     → CheckboxField (single boolean)
 *   MULTI_SELECT → MultiSelectCheckbox (multiple values from a list)
 *   NUMBER       → TextField (type="number", integers only)
 *   DECIMAL      → TextField (type="decimal", step="any")
 *
 * Note: RELATIONSHIP fields are not yet supported and are excluded by
 * getCustomObjectSchema. If a RELATIONSHIP field is encountered, it will
 * fall through to renderCustomObjectField's default case and log a warning.
 */
export type CustomObjectFieldType =
  | 'PRIMARY' // Record identifier — always required, unique, not editable after creation
  | 'TEXT' // Single-line text → TextField
  | 'PARAGRAPH' // Multi-line text → TextareaField
  | 'DATE' // Date → DateField (Trussworks DatePicker)
  | 'DROPDOWN' // Single select → SelectField
  | 'CHECKBOX' // Single boolean → CheckboxField
  | 'MULTI_SELECT' // Multiple values → MultiSelectCheckbox
  | 'NUMBER' // Integer → TextField (type="number")
  | 'DECIMAL' // Decimal → TextField (type="decimal")
  | 'RELATIONSHIP'; // Not yet supported — excluded by getCustomObjectSchema

// ---------------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------------

/**
 * A single choice option within a DROPDOWN or MULTI_SELECT field.
 *
 * Note: Unlike ticket form choices, custom object choices do not have a
 * separate `label` field — `value` serves as both the display text and
 * the submitted value.
 */
export interface CustomObjectChoice {
  id: number;
  // The value displayed to the user and submitted in the record payload.
  // Unlike ticket form choices, there is no separate label field.
  value: string;
  position: number;
}

// ---------------------------------------------------------------------------
// Field options
// ---------------------------------------------------------------------------

/**
 * Additional configuration options for a custom object field.
 * Present in the field_options object on each field.
 */
export interface CustomObjectFieldOptions {
  // Whether field values must be unique across all records in the schema.
  unique?: 'true' | 'false';
}

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

export interface CustomObjectField {
  // UUID identifying this field within the schema.
  id: string;
  // Internal field name used as the key in record payloads.
  // Plain strings (e.g. "title", "journal") — no cf_ prefix.
  name: string;
  // Agent-facing label. Used as the form field label since custom objects
  // don't have a separate customer-facing label like ticket forms do.
  label: string;
  type: CustomObjectFieldType;
  // Display order within the form/record view.
  position: number;
  // Whether this field must have a value when creating a record.
  required: boolean;
  // Whether this field is shown in the record view.
  // Fields where visible is false are excluded from the rendered form.
  visible: boolean;
  // Whether this field has been soft-deleted.
  // Deleted fields are excluded even if visible is true.
  deleted: boolean;
  // Optional placeholder text for the input.
  placeholder: string | null;
  // Additional field configuration — see CustomObjectFieldOptions.
  field_options: CustomObjectFieldOptions;
  // Available choices for DROPDOWN and MULTI_SELECT fields.
  // Empty array for all other field types.
  choices: CustomObjectChoice[];
  // Options for MULTI_SELECT and DROPDOWN fields rendered as
  // MultiSelectCheckbox. Populated at build time by the Astro page
  // if reference data is fetched separately. Falls back to inline
  // choices from the schema response if not set.
  options?: string[];
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

/**
 * A custom object schema — the definition of a custom object type.
 *
 * Returned by GET /api/v2/custom_objects/schemas and
 * GET /api/v2/custom_objects/schemas/{id}.
 *
 * Only the fields we actually use are typed here. The full API response
 * includes additional metadata (version, icon_link, validations, etc.)
 * that we don't need — see the Freshdesk API docs for the complete shape.
 */
export interface CustomObjectSchema {
  // Numeric ID used in API endpoints for records.
  // e.g. GET /api/v2/custom_objects/schemas/{id}/records
  id: number;
  // Internal name for the schema (e.g. "Publications Submission").
  // Useful for debugging without needing to make a separate API call.
  name: string;
  // The fields that make up this schema's data structure.
  fields: CustomObjectField[];
}

export interface CustomObjectSchemasResponse {
  schemas: CustomObjectSchema[];
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

/**
 * A single record belonging to a custom object schema.
 *
 * Records are the actual data instances of a schema — analogous to rows
 * in a database table. Each record's data shape matches the schema's fields.
 *
 * Returned by GET /api/v2/custom_objects/schemas/{id}/records.
 */
export interface CustomObjectRecord {
  // Auto-generated display ID returned after record creation.
  // Format: "{prefix}-{number}" e.g. "_1-1", "_1-2".
  // Used to identify and reference records in the API.
  display_id: string;
  // The record's field values, keyed by field name.
  // Shape matches the schema's field definitions.
  // Values can be strings, numbers, booleans, arrays (for MULTI_SELECT),
  // or null for unset optional fields.
  data: Record<string, unknown>;
}

export interface CustomObjectRecordsResponse {
  records: CustomObjectRecord[];
  // Pagination token for fetching the next set of records.
  // Present when there are more than 100 records.
  // Pass as `marker` query parameter to get the next page.
  links?: {
    next?: string;
  };
}
