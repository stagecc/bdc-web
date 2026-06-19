/**
 * Types for the Freshdesk ticket forms API response.
 *
 * These mirror the shape returned by:
 *   GET /api/v2/ticket-forms/{id}
 *   GET /api/v2/ticket-forms/{id}/fields/{field_id}  (for fields with choices)
 *
 * Only the fields we actually use are typed — the full API response
 * includes additional agent-facing properties we don't need.
 *
 * Freshdesk field types fall into two categories:
 *   - default_* — system fields that map to top-level ticket properties
 *     (email, subject, description, company). These exist on every form
 *     and cannot be deleted, only hidden.
 *   - custom_* — custom fields that map to the custom_fields object
 *     in the ticket payload, always prefixed with cf_ in the field name
 *     (e.g. cf_published_research_journal_name).
 *
 * The cf_ prefix is the reliable mechanism for determining payload shape
 * at submit time — see buildPayload.ts for how this split is handled.
 */

export type FreshdeskFieldType =
  // --- Default system fields ---
  | 'default_requester'    // Email address — maps to top-level `email`
  | 'default_subject'      // Ticket subject — set programmatically, never shown to users
  | 'default_description'  // Ticket body — maps to top-level `description`
  | 'default_company'      // Organization — maps to top-level `company`
  | 'default_ticket_type'  // Ticket type dropdown — maps to top-level `type`.
                           // Uses choices[] from the per-field endpoint.
                           // Can have dynamic sections attached to its choices.

  // --- Custom field types ---
  | 'custom_text'          // Single-line text → TextField (usa-input)
  | 'custom_paragraph'     // Multi-line text → TextareaField (usa-textarea)
  | 'custom_date'          // Date → DateField (Trussworks DatePicker)
                           // Uses Trussworks instead of raw USWDS because the USWDS
                           // date picker requires DOM scanning for JS init, which
                           // conflicts with React's client-side rendering in an island.
  | 'custom_dropdown'      // Single-select dropdown → SelectField (usa-select)
                           // Choices fetched via per-field endpoint at build time.
  | 'custom_checkbox'      // Single boolean checkbox → CheckboxField (usa-checkbox)
  | 'custom_number'        // Integer input → TextField with type="number"
  | 'custom_decimal'       // Decimal input → TextField with type="number" + step="any"
  | 'custom_url'           // URL input → TextField with type="url" + URL validation


/**
 * A single choice option within a dropdown or dependent field.
 *
 * Returned by GET /api/v2/ticket-forms/{id}/fields/{field_id} for fields
 * with type custom_dropdown, default_ticket_type, or nested_field.
 *
 * The choices array is recursive — each choice can have sub-choices,
 * which is how dependent fields (3-level hierarchy) are represented.
 * For flat dropdowns, choices[] on each item will always be empty.
 *
 * Note: In practice, label and value are often identical strings.
 * We use value as the submitted payload value and label as display text,
 * falling back to value if label is empty (as seen in test form data).
 */
export interface FreshdeskChoice {
  id: number
  // Display text shown to the user in the dropdown.
  // May be empty in test/draft forms — fall back to value if so.
  label: string
  // The value submitted to Freshdesk in the ticket payload.
  value: string
  // Display order within the dropdown.
  position: number
  // ID of the parent field this choice belongs to.
  parent_choice_id: number
  // Sub-choices for dependent fields (nested dropdowns).
  // Empty array for flat dropdowns — always check before rendering nested UI.
  choices: FreshdeskChoice[]
}

/**
 * A dynamic section — a group of fields that appears conditionally
 * when a specific dropdown choice is selected.
 *
 * Returned when fetching a form with ?include=section.
 * Each section belongs to a parent dropdown field and is associated
 * with one or more choice IDs from that dropdown.
 *
 * When the user selects a choice whose ID is in choice_ids,
 * all fields whose IDs are in ticket_field_ids become visible.
 * All other section fields remain hidden and excluded from the payload.
 */
export interface FreshdeskSection {
  id: number
  // Display label for the section (may be empty).
  label: string
  // The ID of the parent dropdown field that controls this section's visibility.
  parent_ticket_field_id: number
  // The choice IDs from the parent dropdown that trigger this section.
  // When the selected choice's ID is in this array, the section is shown.
  choice_ids: number[]
  // The IDs of fields that belong to this section.
  // These fields are hidden until the triggering choice is selected.
  ticket_field_ids: number[]
  // The actual field objects belonging to this section, resolved from
  // ticket_field_ids by getFormFields at build time. By the time DynamicForm
  // receives this data, raw IDs have been replaced with full field objects —
  // DynamicForm never needs to cross-reference IDs itself.
  // Fields here are already filtered (displayed_to_customers && !archived)
  // and enriched (choices fetched if needed), same as top-level fields.
  fields: FreshdeskField[]
}

export interface FreshdeskField {
  id: number
  // The field's internal name. custom_* fields are prefixed with cf_
  // (e.g. cf_published_research_journal_name). This prefix is used at
  // submit time to determine whether the value goes into custom_fields
  // or as a top-level ticket property. See buildPayload.ts.
  name: string
  // The customer-facing label. Always use this over `label`, which is
  // the agent-facing version and may differ significantly.
  label_for_customers: string
  type: FreshdeskFieldType
  // Drives required field validation in React Hook Form.
  required_for_customers: boolean
  // Fields where this is false are excluded entirely from the rendered form.
  // Filtering happens in getFormFields — DynamicForm never sees hidden fields.
  displayed_to_customers: boolean
  // Archived fields are excluded even if displayed_to_customers is true.
  // A field may be archived but still present in the API response.
  archived: boolean
  // Optional helper text shown below the label, above the input.
  // Maps to the USWDS hint/help text pattern.
  hint_for_customers?: string
  // Available choices for dropdown and dependent field types.
  // Not returned by GET /api/v2/ticket-forms/{id} — must be fetched
  // via the per-field endpoint and merged in by getFormFields.
  // See getFormFields.ts for how this enrichment is handled.
  choices?: FreshdeskChoice[]
  // True if this field has dynamic sections attached to it.
  // Only present on dropdown fields (custom_dropdown, default_ticket_type).
  // When true, getFormFields fetches section data via ?include=section.
  has_section?: boolean
  // Dynamic sections controlled by this dropdown field.
  // Only present on custom_dropdown and default_ticket_type fields where
  // has_section is true. Each section contains the fields that become
  // visible when a specific choice is selected.
  // Populated by getFormFields at build time — never present on the raw
  // Freshdesk API response, which only returns ticket_field_ids as raw IDs.
  sections?: FreshdeskSection[]
}

export interface FreshdeskFormResponse {
  id: number
  name: string
  title: string
  fields: FreshdeskField[]
  // Present when fetching with ?include=section.
  // Raw section data before getFormFields resolves field IDs to objects.
  sections?: Omit<FreshdeskSection, 'fields'>[]
}