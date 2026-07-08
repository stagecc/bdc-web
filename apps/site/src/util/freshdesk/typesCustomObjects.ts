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
 *     rather than the custom default convention used by ticket forms
 *   - `required` is a direct boolean, not `required_for_customers`
 *   - `visible` replaces `displayed_to_customers`
 *   - `deleted` replaces `archived`
 *   - Choices have `value` but no separate `label` — value serves both purposes
 *   - `hint` replaces `hint_for_customers`
 *   - No dynamic sections — conditional field behavior is handled client-side
 *
 * The cf_ prefix convention does not apply to custom object fields —
 * field names are plain strings (e.g. "title", "journal", "research_area").
 * See buildCustomObjectPayload.ts for how this affects payload construction.
 */

// ---------------------------------------------------------------------------
// Field types
// ---------------------------------------------------------------------------

/**
 * All possible field types for custom object fields.
 *
 * UI component mapping:
 *   PRIMARY      → TextField (always required, unique, the record identifier)
 *   TEXT         → TextField
 *   PARAGRAPH    → TextareaField
 *   DATE         → DateField (Trussworks DatePicker)
 *   DROPDOWN     → SelectField
 *   CHECKBOX     → CheckboxField (single boolean)
 *   MULTI_SELECT → MultiSelectField (multiple values from a list)
 *   NUMBER       → TextField (type="number", integers only)
 *   DECIMAL      → TextField (type="decimal", step="any")
 *   RELATIONSHIP → context-specific component based on ui_hint field value
 *                  e.g. ui_hint="radio" → RadioField
 *                       ui_hint="checkbox-group" → CheckboxGroupField
 *                       ui_hint="researcher-contact" → ResearcherContactField
 *
 * Note: Freshdesk custom objects do not support dependent/dynamic fields
 * natively. Conditional field behavior (e.g. showing "Other" text input
 * when "Other" is selected) is handled entirely client-side in React.
 */
export type CustomObjectFieldType =
  | 'PRIMARY' // Record identifier — always required, unique, not editable after creation
  | 'TEXT' // Single-line text → TextField
  | 'PARAGRAPH' // Multi-line text → TextareaField
  | 'DATE' // Date → DateField (Trussworks DatePicker)
  | 'DROPDOWN' // Single select → SelectField
  | 'CHECKBOX' // Single boolean → CheckboxField
  | 'MULTI_SELECT' // Multiple values → MultiSelectField
  | 'NUMBER' // Integer → TextField (type="number")
  | 'DECIMAL' // Decimal → TextField (type="decimal")
  | 'RELATIONSHIP'; // Lookup to another object — rendered based on ui_hint

// ---------------------------------------------------------------------------
// Choices
// ---------------------------------------------------------------------------

/**
 * A single choice option within a DROPDOWN or MULTI_SELECT field.
 *
 * Note: Unlike ticket form choices, custom object choices do not have a
 * separate `label` field — `value` serves as both the display text and
 * the submitted value. dependent_ids supports conditional choice behavior
 * but is empty ({}) for flat dropdowns.
 */
export interface CustomObjectChoice {
  id: number;
  // The value displayed to the user and submitted in the record payload.
  // Unlike ticket form choices, there is no separate label field.
  value: string;
  position: number;
  // Conditional choice dependencies — empty object for flat dropdowns.
  // Populated when choices conditionally show/hide other choices.
  dependent_ids: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Field options
// ---------------------------------------------------------------------------

/**
 * Additional configuration options for a custom object field.
 * Present in the field_options object on each field.
 *
 * ui_hint is our own convention — added as a TEXT field on reference data
 * schemas (PublicationStatus, ResearchCommunities, etc.) to tell the
 * renderer which component to use for that schema's records.
 * See getCustomObjectRecords.ts for how this is used.
 */
export interface CustomObjectFieldOptions {
  // Whether field values must be unique across all records in the schema.
  unique?: 'true' | 'false';
  // For RELATIONSHIP fields — whether the related object is a native
  // Freshdesk object (NATIVE: tickets, contacts, companies) or a custom object.
  related_object_type?: 'NATIVE' | 'CUSTOM';
  // Our convention for RELATIONSHIP fields — tells the renderer which
  // component to use. Values: "radio", "checkbox-group", "researcher-contact"
  ui_hint?: string;
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
  // Whether agents can edit this field after record creation.
  editable: boolean;
  // Whether this field is shown in the record view.
  // Fields where visible is false are excluded from the rendered form.
  visible: boolean;
  // Whether this field has been soft-deleted.
  // Deleted fields are excluded even if visible is true.
  deleted: boolean;
  // Optional placeholder text for the input.
  placeholder: string | null;
  // Optional hint text shown below the label, above the input.
  // Maps to the USWDS hint/help text pattern.
  hint: string | null;
  // Additional field configuration — see CustomObjectFieldOptions.
  field_options: CustomObjectFieldOptions;
  // Whether this field can be used to filter records.
  filterable: boolean;
  // Whether this field is included in full-text search.
  searchable: boolean;
  // Whether this field can be aggregated in reports.
  aggregatable: boolean;
  // Whether other fields depend on this field's value.
  has_dependents: boolean;
  // ID of the parent field for dependent fields. null for top-level fields.
  parent_id: string | null;
  // Available choices for DROPDOWN and MULTI_SELECT fields.
  // Empty array for all other field types.
  choices: CustomObjectChoice[];
  // Default value for the field. null if no default is set.
  default: unknown | null;
  // Validation rules for the field (e.g. min/max length, regex).
  validations: Record<string, unknown>;
  // Present on RELATIONSHIP fields only.
  // The numeric ID of the related entity (2 = Contacts for NATIVE relationships).
  related_entity_id?: number;
  // Internal name for the relationship from this object's perspective.
  relationship_name?: string;
  // Internal name for the reverse relationship from the related object's perspective.
  child_relationship_name?: string;
  // Options for MULTI_SELECT, DROPDOWN, and RELATIONSHIP fields rendered
  // as RadioField or MultiSelectCheckbox. Populated at build time by the
  // Astro page after fetching reference data via getReferenceDataValues().
  // Not present on the raw Freshdesk API response — added during enrichment.
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
 * The schema defines the structure of all records of this object type,
 * analogous to a database table definition.
 */
export interface CustomObjectSchema {
  // Numeric ID used in API endpoints for records.
  // e.g. GET /api/v2/custom_objects/schemas/{id}/records
  id: number;
  // Internal name for the schema (e.g. "Publications Submission").
  name: string;
  // Short prefix used in display IDs for records (e.g. "_1").
  prefix: string;
  // Optional display title — may be null.
  title: string | null;
  // Optional description of the schema's purpose.
  description: string;
  // The fields that make up this schema's data structure.
  fields: CustomObjectField[];
  // Schema version — incremented when fields are added or modified.
  version: number;
  // Whether this schema has been soft-deleted.
  deleted: boolean;
  // Additional form configuration options.
  form_options: Record<string, unknown>;
  // Schema-level validation rules.
  validations: Record<string, unknown>;
  // URL for the schema's icon displayed in the Freshdesk admin UI.
  icon_link: string;
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
